(ns mal.env)

(defn bind [params args]
  (let [before-amp (take-while (fn [s] (not= s '&)) params)
        [_ rest] (drop-while (fn [s] (not= s '&)) params)
        binding-map (into {} (map vector before-amp (take (count before-amp) args)))]
    (if rest
      (assoc binding-map rest (apply list (drop (count before-amp) args)))
      binding-map)))

(comment
  (bind '(& r) '(1 2 3))
  (bind '(x & r) '(1 2 3))
  (bind '(x y & r) '(1 2 3)))

(defn make-env
  ([] (make-env nil {}))
  ([outer] (make-env outer {}))
  ([outer initial-bindings]
   {:outer outer
    :data (atom initial-bindings)})
  ([outer binds values]
   (make-env outer (bind binds values))))

(defn set-symbol [k v {data :data}]
  (swap! data assoc k v)
  nil)

(defn find-symbol [k env]
  (loop [{data :data outer :outer :as current-env} env]
    (if (contains? @data k)
      current-env
      (when outer (recur outer)))))

(defn get-symbol [k env]
  (if-let [{data :data} (find-symbol k env)]
    (@data k)
    (throw (ex-info (str \" k \" " not found") {:k k}))))
