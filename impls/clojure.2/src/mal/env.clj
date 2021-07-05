(ns mal.env)

(defn make-env 
  ([] (make-env nil {}))
  ([outer] (make-env outer {}))
  ([outer initial-bindings]
   {:outer outer
    :data (atom initial-bindings)})
  ([outer binds values]
  (make-env outer (into {} (map vector binds values)))))

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
