(ns mal.step2_eval
  (:require
   [mal.printer]
   [mal.reader]))

(defn READ [s]
  (mal.reader/read-form s))

(declare EVAL)

(defn eval-ast [ast env]
  (cond
    (symbol? ast)
    (do
      (when-not (contains? env ast)
        (throw (ex-info "" {:env env :symbol ast})))
      (env ast))

    (list? ast)
    (map #(EVAL % env) ast)

    (vector? ast)
    (mapv #(EVAL % env) ast)

    (map? ast)
    (into {} (for [[k v] ast] [k (EVAL v env)]))

    :else
    ast))

(defn EVAL [ast env]
  (let [evaluated-ast (eval-ast ast env)]
    (if (list? ast)
      (if (empty? ast)
        ast
        (apply (first evaluated-ast) (rest evaluated-ast)))
      evaluated-ast)))

(defn PRINT [s]
  (mal.printer/pr-str s))

(defn rep [input env]
  (->
   input
   READ
   (EVAL env)
   PRINT))

(def start-env
  {'+ (fn [x y] (+ x y))
   '- (fn [x y] (- x y))
   '* (fn [x y] (* x y))
   '/ (fn [x y] (quot x y))})

(loop []
  (print "user> ")
  (flush)
  (when-let [line (read-line)]
    (try
      (println (rep line start-env))
      (catch Exception e
        (println (str "error:" (ex-message e)))))
    (recur)))