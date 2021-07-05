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

(defn pr-str [ds]
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
                 (map pr-str)
                 (str/join " ")) \))

    (vector? ds)
    (str \[ (->> ds
                 (map pr-str)
                 (str/join " ")) \])

    (map? ds)
    (str \{ (->> ds
                 (mapcat identity)
                 (map pr-str)
                 (str/join " ")) \})

    (string? ds)
    (str \" (escape ds) \")

    (keyword? ds)
    (str ds)
    
    (fn? ds)
    "#<function>"))

(comment
  (pr-str '(= 2 3))

  (pr-str '[2 4])
  (pr-str '{"a" 2 "c" 3})
  (pr-str {"abc" 1}))
