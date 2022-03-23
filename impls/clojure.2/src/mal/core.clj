(ns mal.core
  (:refer-clojure :exclude [ns])
  (:require
   [clojure.string]
   [mal.printer]))

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
   'nth nth
   'first first
   'rest (fn [coll] (apply list (rest coll)));
   })
