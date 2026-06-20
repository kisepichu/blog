---
title: 型無し $\lambda$ 計算 (2) 構文論
status: draft
tags: [型理論]
series: types-and-logic
series_order: 2
date: 2026-05-17
---

[前回](types-and-logic-1.md)は、型無し λ 計算の意味を日本語で考え、慣れた。今回から、型無し λ 計算の体系の定義をする。

## 構文論

型無し λ 計算の構文を定義していく。

以下では、変数記号の集合 $V$ を考える。

:::definition{#untyped-lc-term-long title="前項"}

型無し λ 計算の **項(term)** を、以下のように再帰的に定義する。

- $x\in V$ であるとき、 **変数(variable)** $x$ は項である。
- $M$ が項であるとき、 **λ 抽象(abstraction)** $(\lambda x.M)$ は項である。
- $M_1, M_2$ が項であるとき、**適用(application)** $(M_1 M_2)$ は項である。
- 上記のみが項である。

:::

このような定義を省略して、次のように書くことがある。これを **BNF(バッカス＝ナウア記法)** と言う。

:::definition{#untyped-lc-term title="項"}

$$
\begin{align*}
M ::=&   &\quad (\text{term}) \\\\
  \quad \mid\ &x &\quad (\text{variable}) \\\\
  \quad \mid\ &(\lambda x.M) &\quad (\text{abstraction}) \\\\
  \quad \mid\ &(M_1 M_2) &\quad (\text{application}) \\\\
  & &(x\in V)
\end{align*}
$$

次のように、名前を書かない書き方もある。

$$
M ::= x \mid (\lambda x.M) \mid (M_1 M_2) \quad (x\in V)
$$

:::

括弧は適宜省略する:

:::notation{#test-notation}

以下の略記を用いる。

$$
\begin{align*}
(M_1 M_2 M_3) &::= ((M_1 M_2) M_3) \\\\
(\lambda x_1.\lambda x_2. M) &::= (\lambda x_1.(\lambda x_2. M)) \\\\
(\lambda x.M_1 M_2) &::= (\lambda x.(M_1 M_2)) \\\\
(M_1 \lambda x. M_2) &::= (M_1 (\lambda x. M_2))
\end{align*}
$$

:::

また、本文中に出てくる項の最も外側の括弧は省略する。

項の例を見る。

:::example{#test-example title="λ 項"}

$V=\\\{\mathtt{x}, \mathtt{y}\\\}$ とする。

- a

:::

:::definition{#untyped-lc-fv title="自由変数"}
項 $M$ に対し集合 $FV(M)$ を以下のように定義し、その要素を $M$ の **自由変数(free variable)** と呼ぶ。

$$
\begin{align*}
FV(x) &= \{x\} \\\\
FV(\lambda x.M) &= FV(M) \setminus \{x\} \\\\
FV(M_1 M_2) &= FV(M_1) \cup FV(M_2)
\end{align*}
$$

:::

$FV(M)=\emptyset$ であるとき、 $M$ は **閉じている(closed)** と言う。

項 $M,N$ および $x\in V$ に対し、$M$ における $x$ を $N$ で置き換える代入を $M[x:=N]$ と書き、次のように定義する。ただし $x\neq y$ とする。

:::definition{#untyped-lc-substitution title="代入"}

$$
\begin{align*}
x[x:=N] &= N,\\\\
y[x:=N] &= y,\\\\
(M_1 M_2)[x:=N] &= M_1[x:=N] M_2[x:=N],\\\\
(\lambda x.M)[x:=N] &= \lambda x.M,\\\\
(\lambda y.M)[x:=N] &= \lambda y.M[x:=N]
  &&\text{if } y\notin FV(N) \text{ or } x\notin FV(M),\\\\
(\lambda y.M)[x:=N] &= \lambda z.M[y:=z][x:=N]
  &&\text{if } y\in FV(N) \text{ and } x\in FV(M).
\end{align*}
$$

:::

[前回](types-and-logic-1.md)触れたように、入力に対して何かを出力するのが計算で、引数名が異なるだけの λ 抽象は同じものを表すと考える。本ブログでは、簡単のため、非形式的に「それらは構文的に同じである」、つまり $x, y$ が変数のとき項 $\lambda x.M$ と項 $\lambda y.M[x:=y] (y \notin \text{FV}(M))$ が同じだとする。前者を後者に変える操作を **$\alpha$ 変換** と呼ぶ。正確に項を定義したいなら、まず前項を上の項のように定義し、 $\alpha$-同値関係を定義して、全ての前項からなる集合を $\alpha$-同値関係で割ったものを項の集合とする、というアイデアで項を定義する必要がある。

---

## まとめ、今後の予定

## 雑談 (1) 具象構文と抽象構文

todo: untyped lc の具象構文を書き、 parse について書き、 parse された後の抽象構文だけ考えるということを書く

## 参考文献
