(ns mal.printer)

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
    (symbol? ds)
    (str ds)

    (number? ds)
    (str ds)

    (list? ds)
    (str \( (->> ds
                 (map pr-str)
                 (clojure.string/join " ")) \))

    (vector? ds)
    (str \[ (->> ds
                 (map pr-str)
                 (clojure.string/join " ")) \])

    (map? ds)
    (str \{ (->> ds
                 (mapcat identity)
                 (map pr-str)
                 (clojure.string/join " ")) \})

    (string? ds)
    (str \" (escape ds) \")))

(comment
  (pr-str '(= 2 3))

  (pr-str '[2 4])
  (pr-str '{"a" 2 "c" 3})
  (pr-str {"abc" 1}))
