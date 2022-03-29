(ns mal.core
  (:refer-clojure :exclude [ns])
  (:require
   [clojure.string]
   [mal.printer]
   [mal.reader]))

(defn mal-throw [value]
  (throw (ex-info (str "mal-exception: " value) {:type :mal-exception :value value})))

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

   'read-string (fn [s] (try (mal.reader/read-form s)
                             (catch Exception e
                               (-> e ex-message str mal-throw))))
   'slurp slurp
   'atom (fn [v] (clojure.core/atom v))
   'atom? (fn [a] (instance? clojure.lang.Atom a))
   'deref deref
   'reset! reset!
   'readline (fn [prompt] (println prompt) (read-line))
   '*host-language* "clojure"
   'time-ms (fn [] (quot (. System (nanoTime)) 1000000))
   'meta (fn [o] (:mal/meta (meta o)))
   'with-meta (fn [obj m] (with-meta obj {:mal/meta m}))
   'fn? (fn [v] (or (fn? v) (mal.printer/closure? v)))
   'string? string?
   'number? number?
   'seq (fn [coll] (if (empty? coll)
                     nil
                     (apply list
                            (if (string? coll)
                              (map str coll)
                              coll))))
   'conj conj ;
   })
