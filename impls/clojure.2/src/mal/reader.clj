(ns mal.reader
  (:require
   [clojure.string]))

(def token-regex 
  #"[\s,]*(~@|[\[\]{}()'`~^@]|\"(?:\\.|[^\\\"])*\"?|;.*|[^\s\[\]{}('\"`,;)]*)")

(defn tokenize [s]
  (->> s
       (re-seq token-regex)
       (map second)
       butlast))

(defn read-atom [s]
  (cond
    (Character/isDigit (first s))
    (Long/parseLong s)

    :else
    (symbol s)))

(comment
  (read-atom "123")
  (read-atom "abc"))

(defn make-reader-object [tokens]
  (atom tokens))

(defn peek [atom]
  (first @atom))

(defn next! [atom]
  (swap! atom rest)
  nil)

(comment
  (tokenize "fa (=   3 2) ()")
  (def matcher (re-matcher token-regex "fa (= 3 2)"))
  (re-find matcher)
  (def reader-atom (atom '("122" "34")))

  (peek reader-atom)
  (next! reader-atom))

(def read-list!)

(def unescape-mapping
  {\" \"
   \n \newline
   \\ \\})

(defn unescape [s]
  (loop [i 0
         result []]
    (if (< i (count s))
      (let [c (.charAt s i)]
        (if (= c \\)
          (do
            (when-not (< (inc i) (count s))
              (throw (ex-info "unbalanced: slash at end" {})))
            (let
             [next-char (.charAt s (inc i))
              escaped-char (unescape-mapping next-char)]
              (when-not escaped-char (throw (ex-info "illegal escape char" {:next-char next-char})))
              (recur (+ i 2) (conj result escaped-char))))
          (recur (inc i) (conj result c))))
      (apply str result))))

(comment
  (unescape "abc")
  (unescape "\\")
  (unescape "\\\\")

  (unescape "\"")
  (unescape "\\n")

  (unescape "ab\\\"de")
  (apply str [\a \b]))

(defn read-form! [reader-object]
  (let [current (peek reader-object)
        _ (next! reader-object)]
    (case (first current)
      \(
      (apply list (read-list! reader-object))

      \[
      (apply vector (read-list! reader-object))

      \{
      (apply hash-map (read-list! reader-object))

      \"
      (do
        (when (= 1 (count current))
          (throw (ex-info "unbalanced" {})))
        (when-not (= \" (last current))
          (throw (ex-info "unbalanced" {})))
        (let [raw-string (subs current 1 (dec (count current)))]
          (unescape raw-string)))

      \:
      (-> current (subs 1) keyword)

      (read-atom current))))

(defn read-list! [reader-object]
  (loop [result []]
    (case (-> reader-object
              peek
              first)
      nil
      (throw (ex-info "reached EOF inside list unbalanced" {}))

      \)
      (do
        (next! reader-object)
        result)

      \]
      (do
        (next! reader-object)
        result)

      \}
      (do
        (next! reader-object)
        result)

      (recur (conj result (read-form! reader-object))))))

(defn read-form [s]
  (-> s
      tokenize
      make-reader-object
      read-form!))

(comment
  (read-form! (make-reader-object (tokenize "( + 2 (* 3 4) )")))
  (read-form "( + 2 (* 3 4) )")
  (read-form "[()  2 \"abc\"]")
  (read-form "{\"ab\" 1}")
  (read-form " \"asd "))
