(ns mal.step8-macros
  (:refer-clojure :exclude [macroexpand])
  (:require
   [mal.printer]
   [mal.reader]
   [mal.env]
   [mal.core]))

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

(defn mal-apply [f args]
  (if (fn? f)
    (apply f args)
    (let [{:keys [ast params env]} f
          new-env (mal.env/make-env env params args)]
      (EVAL ast new-env))))

(defn quasiquote [ast]
  (cond
    (list? ast)
    (cond
      (empty? ast)
      ast

      (and (= (first ast) 'unquote) (not (nil? (second ast))))
      (second ast)

      :else
      (let [elt (first ast)
            elts (rest ast) ; use rest instead of destructuring to get () not nil on empty
            ]
        (if (and (list? elt) (= 'splice-unquote (first elt)))
          (list 'concat (second elt) (quasiquote elts))
          (list 'cons (quasiquote elt) (quasiquote elts)))))

    (or (map? ast) (symbol? ast))
    (list 'quote ast)

    (vector? ast)
    (if (= (first ast) 'unquote)
      (list 'vec (list 'cons '(quote unquote) (quasiquote (apply list (rest ast)))))
      (list 'vec (quasiquote (apply list ast))))

    :else
    ast))

(defn macro-call? [ast env]
  (and (list? ast)
       (symbol? (first ast))
       (:is-macro (mal.env/try-get-symbol (first ast) env))))

(defn macroexpand [call-ast env]
  (if (macro-call? call-ast env)
    (let [[first-form & args] call-ast
          {:keys [ast params env]} (mal.env/get-symbol first-form env)
          new-env (mal.env/make-env env params args)]
      (EVAL ast new-env))
    call-ast))

(defn EVAL [ast env]
  (if (list? ast)
    (if (empty? ast)
      ast
      (let [ast (macroexpand ast env)]
        (if-not (list? ast)
          (eval-ast ast env)
          (let [[first-form & forms] ast]
            (cond
              (= first-form 'def!)
              (let [[name exp] forms
                    evaluated-exp (EVAL exp env)]
                (mal.env/set-symbol name evaluated-exp env)
                evaluated-exp)

              (= first-form 'defmacro!)
              (let [[name exp] forms
                    evaluated-exp (EVAL exp env)
                    macro-exp (assoc evaluated-exp :is-macro true)]
                (mal.env/set-symbol name macro-exp env)
                macro-exp)

              (= first-form 'let*)
              (let [[bindings body] forms
                    new-env (mal.env/make-env env)]
                (doseq [[name exp] (partition 2 bindings)]
                  (mal.env/set-symbol name (EVAL exp new-env) new-env))
                (recur body new-env))

              (= first-form 'do)
              (do
                (doseq [f (butlast forms)] (EVAL f env))
                (recur (last forms) env))

              (= first-form 'if)
              (let [[condition true-form false-form] forms]
                (if (EVAL condition env)
                  (recur true-form env)
                  (recur false-form env)))

              (= first-form 'fn*)
              (let [[params body] forms]
                (mal.printer/map->Closure
                 {:ast body
                  :params params
                  :env env}))

              (= first-form 'quote)
              (first forms)

              (= first-form 'quasiquoteexpand)
              (quasiquote (first forms))

              (= first-form 'quasiquote)
              (recur (quasiquote (first forms)) env)

              (= first-form 'macroexpand)
              (macroexpand (first forms) env)

              :else
              (let [f (EVAL first-form env)
                    args (for [form forms] (EVAL form env))]
                (if (fn? f)
                  (apply f args)
                  (recur (:ast f) (mal.env/make-closure-env f args)))))))))
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

(def mal-ns
  {'eval (fn [ast] (EVAL ast repl-env))
   'swap! (fn [a f & params] (apply swap! a (fn [& ps] (mal-apply f ps)) params))})

(doseq [[s f] (merge mal.core/ns mal-ns)]
  (mal.env/set-symbol s f repl-env))

(def string-defs
  ["(def! not (fn* (a) (if a false true)))"
   "(def! load-file (fn* (f) (eval (read-string (str \"(do \" (slurp f) \"\nnil)\")))))"
   "(defmacro! cond (fn* (& xs) (if (> (count xs) 0) (list 'if (first xs) (if (> (count xs) 1) (nth xs 1) (throw \"odd number of forms to cond\")) (cons 'cond (rest (rest xs)))))))"])

(doseq [s string-defs]
  (rep s repl-env))

(mal.env/set-symbol '*ARGV* (apply list (rest *command-line-args*)) repl-env)

(if *command-line-args*
  (rep (str "(load-file \"" (first *command-line-args*) "\")") repl-env)
  (loop []
    (print "user> ")
    (flush)
    (when-let [line (read-line)]
      (try
        (println (rep line repl-env))
        (catch Exception e
          (println (str "error:" (ex-message e)))))
      (recur))))
