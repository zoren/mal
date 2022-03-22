(ns mal.step7-quote
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
          (list 'cons (quasiquote elt) (quasiquote elts)) ; not sure
          )))

    (or (map? ast) (symbol? ast))
    (list 'quote ast)

    (vector? ast)
    (if (= (first ast) 'unquote)
      (list 'vec (list 'cons '(quote unquote) (quasiquote (apply list (rest ast)))))
      (list 'vec (quasiquote (apply list ast))))

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

          :else
          (let [f (EVAL first-form env)
                args (for [form forms] (EVAL form env))]
            (if (fn? f)
              (apply f args)
              (let [{:keys [ast params env]} f
                    new-env (mal.env/make-env env params args)]
                (recur ast new-env)))))))
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
  {'read-string mal.reader/read-form
   'slurp slurp
   'eval (fn [ast] (EVAL ast repl-env))
   'atom (fn [v] (clojure.core/atom v))
   'atom? (fn [a] (instance? clojure.lang.Atom a))
   'deref deref
   'reset! reset!
   'swap! (fn [a f & params] (apply swap! a (fn [& ps] (mal-apply f ps)) (map (fn [ast] (EVAL ast repl-env)) params)))
   '*ARGV* (apply list *command-line-args*)})

(doseq [[s f] (merge mal.core/ns mal-ns)]
  (mal.env/set-symbol s f repl-env))

(rep "(def! not (fn* (a) (if a false true)))" repl-env)

(rep "(def! load-file (fn* (f) (eval (read-string (str \"(do \" (slurp f) \"\nnil)\")))))" repl-env)

(loop []
  (print "user> ")
  (flush)
  (when-let [line (read-line)]
    (try
      (println (rep line repl-env))
      (catch Exception e
        (println (str "error:" (ex-message e)))))
    (recur)))

(comment
  (let [e (mal.env/make-env)]
    (doseq [[s f] (merge mal.core/ns mal-ns)]
      (mal.env/set-symbol s f e))
    ;(rep "(def! a 7)" e)
;    (rep "(quote (a a))" e)
    (rep "(quasiquote (a a))" e)
    (rep "(cons 1 (cons 2 (cons 3 nil)))" e))

  (EVAL '(quasiquote (a (unquote a) a))
        '{a 4})
  (EVAL 'a
        '{a 4}) ;
  (EVAL '(list 1 2 3)
        '{a 4}) ;
  (quote (1 2 3)))
