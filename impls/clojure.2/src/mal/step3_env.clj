(ns mal.step3_env
  (:require
   [mal.printer]
   [mal.reader]
   [mal.env]))

(defn READ [s]
  (mal.reader/read-form s))

(declare EVAL)

(defn eval-ast [ast env]
  (cond
    (symbol? ast)
    (mal.env/get-symbol ast env)

    (list? ast)
    (map #(EVAL % env) ast)

    (vector? ast)
    (mapv #(EVAL % env) ast)

    (map? ast)
    (into {} (for [[k v] ast] [k (EVAL v env)]))

    :else
    ast))

(defn EVAL [ast env]
  (if (list? ast)
    (if (empty? ast)
      ast
      (let [[first-form & forms] ast]
        (cond
          (= first-form 'def!)
          (let [[name exp] forms
                evaluated-exp (EVAL exp env)]
            (mal.env/set-symbol name evaluated-exp env)
            evaluated-exp)

          (= first-form 'let*)
          (let [[bindings body] forms
                new-env (mal.env/make-env env)]
            (prn bindings body new-env)
            (doseq [[name exp] (partition 2 bindings)]
              (prn name exp)
              (mal.env/set-symbol name (EVAL exp new-env) new-env))
            (EVAL body new-env))

          :else
          (apply (EVAL first-form env) (for [form forms] (EVAL form env))))))
    (eval-ast ast env)))

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

(def repl-env
  (mal.env/make-env))

(doseq [[s f] start-env]
  (mal.env/set-symbol s f repl-env))

(loop []
  (print "user> ")
  (flush)
  (when-let [line (read-line)]
    (try
      (println (rep line repl-env))
      (catch Exception e
        (println (str "error:" (ex-message e)))))
    (recur)))
