(ns user
  (:refer-clojure :exclude [read eval print]))

(defn read2 [s]
  ;(read-line)
  s)

(defn eval2 [x]
  x)

(defn print2 [s]
  s)

(def rep (comp print2 eval2 read2)
  )

(loop []
  (print "user> ")
  (flush)
  (when-let [line (read-line)]
    (println (rep line))
    (recur)))
