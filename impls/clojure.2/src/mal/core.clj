(ns mal.core
  (:refer-clojure :exclude [ns])
  (:require
   [clojure.string]
   [mal.printer]
   [mal.reader]))

(defn mal-throw [value]
  (throw (ex-info "mal-exception" {:type :mal-exception :value value})))

(defn mal-exception? [e] (-> e ex-data :type (= :mal-exception)))

(defn mal-exception-value [e] (-> e ex-data :value))

(def ns
  {'+ (fn [x y] (+ x y))
   '- (fn [x y] (- x y))
   '* (fn [x y] (* x y))
   '/ (fn [x y] (quot x y))
   'list list
   'list? list?
   'empty? empty?
   'count count
   '= =
   '< <
   '<= <=
   '> >
   '>= >=
   'pr-str (fn [& params] (clojure.string/join " " (map mal.printer/pr-str params)))
   'str (fn [& params] (apply str (map #(mal.printer/pr-str % false) params)))
   'prn (fn [& params] (println (clojure.string/join " " (map mal.printer/pr-str params))) nil)
   'println (fn [& params] (println (clojure.string/join " " (map #(mal.printer/pr-str % false) params))) nil)
   'cons (fn [e l] (apply list (cons e l)))
   'concat (fn [& ls] (apply list (apply concat ls)))
   'vec vec
   'nth (fn [coll index] (try (nth coll index)
                              (catch IndexOutOfBoundsException _e
                                (mal-throw "Index out of bounds"))))
   'first first
   'rest (fn [coll] (apply list (rest coll)))
   'throw mal-throw
   'nil? nil?
   'true? true?
   'false? false?
   'symbol? symbol?

   'symbol symbol
   'keyword keyword
   'keyword? keyword?
   'vector vector
   'vector? vector?
   'sequential? sequential?
   'hash-map hash-map
   'map? map?
   'assoc assoc
   'dissoc dissoc
   'get get
   'contains? contains?
   'keys (fn [m] (apply list (keys m)))
   'vals (fn [m] (apply list (vals m)))

   'read-string mal.reader/read-form
   'slurp slurp
   'atom (fn [v] (clojure.core/atom v))
   'atom? (fn [a] (instance? clojure.lang.Atom a))
   'deref deref
   'reset! reset!
   'readline (fn [prompt] (println prompt) (read-line))
   '*host-language* "clojure"
   'time-ms (fn [& _] (mal-throw "not supported"))
   'meta (fn [& _] (mal-throw "not supported"))
   'with-meta (fn [& _] (mal-throw "not supported"))
   'fn? (fn [& _] (mal-throw "not supported"))
   'string? (fn [& _] (mal-throw "not supported"))
   'number? (fn [& _] (mal-throw "not supported"))
   'seq (fn [& _] (mal-throw "not supported"))
   'conj (fn [& _] (mal-throw "not supported"));
   })
