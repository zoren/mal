(ns mal.step0_repl)

(defn READ [s] s)

(defn EVAL [x] x)

(defn PRINT [s] s)

(defn rep [input]
  (->
   input
   READ
   EVAL
   PRINT))

(loop []
  (print "user> ")
  (flush)
  (when-let [line (read-line)]
    (println (rep line))
    (recur)))
