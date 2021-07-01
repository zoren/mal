(ns mal.step1-read-print
  (:require
   [mal.printer]
   [mal.reader]))

(defn READ [s]
  (mal.reader/read-form s))

(defn EVAL [x]
  x)

(defn PRINT [s]
  (mal.printer/pr-str s))

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
    (try
      (println (rep line))
      (catch Exception e
        (println (str "error:" (ex-message e)))
          ))
    (recur)))
