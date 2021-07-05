(ns mal.step4-if-fn-do
  (:require
   [mal.printer]
   [mal.reader]
   [mal.env]
   [mal.core]))

(defn READ [s]
  (mal.reader/read-form s))

(def EVAL)

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
            (doseq [[name exp] (partition 2 bindings)]
              (mal.env/set-symbol name (EVAL exp new-env) new-env))
            (EVAL body new-env))

          (= first-form 'do)
          (do
            (doseq [form (butlast forms)]
              (EVAL form env))
            (EVAL (last forms) env))

          (= first-form 'if)
          (let [[condition true-form false-form] forms]
            (if (EVAL condition env)
              (EVAL true-form env)
              (EVAL false-form env)))
          
          (= first-form 'fn*)
          (let [[params body] forms]
            (fn [& args]
              (let [new-env (mal.env/make-env env params args)]
               (EVAL body new-env))))

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

(def repl-env
  (mal.env/make-env))

(doseq [[s f] mal.core/ns]
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
