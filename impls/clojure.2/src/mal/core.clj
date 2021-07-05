(ns mal.core
  (:refer-clojure :exclude [ns])
  (:require
   [mal.printer]))

(def ns
  {'+ (fn [x y] (+ x y))
   '- (fn [x y] (- x y))
   '* (fn [x y] (* x y))
   '/ (fn [x y] (quot x y))
   'prn (fn [form] (println (mal.printer/pr-str form)) nil)
   'list list
   'list? list?
   'empty? empty?
   'count count
   '= =
   '< <
   '<= <=
   '> >
   '>= >=})
