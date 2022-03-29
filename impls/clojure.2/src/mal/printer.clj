(ns mal.printer
  (:refer-clojure :exclude [pr-str])
  (:require [clojure.string :as str]))

(def escape-mapping
  {\" \"
   \newline \n
   \\ \\})

(defn escape [s]
  (apply str
         (mapcat (fn [c]
                   (if-let [mc (escape-mapping c)]
                     [\\ mc]
                     [c])) s)))

(comment
  (escape "abc\ndef"))

(defrecord Closure [ast params env is-macro])

(def closure? (partial instance? Closure))

(defn pr-str
  ([outer-ds] (pr-str outer-ds true))
  ([outer-ds print-readably]
   ((fn go [ds]
      (cond
        (nil? ds)
        "nil"

        (= ds false)
        "false"

        (= ds true)
        "true"

        (symbol? ds)
        (str ds)

        (number? ds)
        (str ds)

        (list? ds)
        (str \( (->> ds
                     (map go)
                     (str/join " ")) \))

        (vector? ds)
        (str \[ (->> ds
                     (map go)
                     (str/join " ")) \])

        (closure? ds)
        "#<function>"

        (fn? ds)
        "#<function>"

        (map? ds)
        (str \{ (->> ds
                     (mapcat identity)
                     (map go)
                     (str/join " ")) \})

        (string? ds)
        (if print-readably
          (str \" (escape ds) \")
          ds)

        (keyword? ds)
        (str ds)

        (instance? clojure.lang.Atom ds)
        (str "(atom " (go @ds) \))

        :else
        (throw (ex-info "pr-str: unknown data" {:data ds})))) outer-ds)))

(comment
  (pr-str '(= 2 3))
  (pr-str "abc" true)
  (pr-str "abc" false)

  (pr-str '[2 4])
  (pr-str '{"a" 2 "c" 3})
  (pr-str {"abc" 1}))
