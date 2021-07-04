(ns mal.env)

(defn make-env 
  ([] (make-env nil))
  ([outer]
  {:outer outer
   :data (atom {})}))

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
    (throw (ex-info (str k " not found") {:k k}))))
