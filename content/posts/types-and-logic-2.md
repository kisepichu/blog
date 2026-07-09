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

:::definition{#untyped-lc-term-long title="項"}

型無し λ 計算の **項(term)** を、以下のように再帰的に定義する。 $x$ は $V$ の要素とする。

- **変数(variable)** $x$ は項である。
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

:::notation{#parenthesis-convention}

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

:::example{#example-term title="λ 項"}

$V=\\\{\mathtt{x}, \mathtt{y}\\\}$ とする。
  
- $\mathtt{x}$, $\mathtt{y}$ — 変数そのもの
- $\lambda \mathtt{x}.\mathtt{x}$ — λ 抽象（恒等関数）
- $(\lambda \mathtt{x}.\mathtt{x})\,\mathtt{y}$ — 適用（外側括弧省略の対比用に、ここだけ括弧を残す）
- $\lambda \mathtt{x}.\lambda \mathtt{y}.\mathtt{x}$ — 入れ子の λ（カリー化）
- $\lambda \mathtt{x}.\mathtt{x}\,\mathtt{y}$ — 略記 $\lambda \mathtt{x}.(\mathtt{x}\,\mathtt{y})$（λ の体は適用全体）
- $\lambda \mathtt{x}.\mathtt{y}$ — 自由変数 $\mathtt{y}$（$FV = \{\mathtt{y}\}$）
- $\lambda \mathtt{x}.\lambda \mathtt{x}.\mathtt{x}$ — 変数のシャドーイング（内側の $\mathtt{x}$ が有効）


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

代入を次で定義する。

:::definition{#untyped-lc-substitution title="代入"}

項 $M,N$ および変数 $x\in V$ に対し、$M$ における $x$ を $N$ で置き換える代入を $M[x\mapsto N]$ と書き、次のように定義する。ただし $x\neq y$ とし、 $\mathtt{z}$ は $\mathtt{z} \notin FV(N) \cup FV(M) \cup \\{x,y\\}$ なる変数とする。

$$
\begin{align*}
x[x\mapsto N] &= N,\\\\
y[x\mapsto N] &= y,\\\\
(M_1 M_2)[x\mapsto N] &= M_1[x\mapsto N] M_2[x\mapsto N],\\\\
(\lambda x.M)[x\mapsto N] &= \lambda x.M,\\\\
(\lambda y.M)[x\mapsto N] &= \lambda y.M[x\mapsto N]
  &&\text{if } y\notin FV(N) \text{ or } x\notin FV(M),\\\\
(\lambda y.M)[x\mapsto N] &= \lambda \mathtt{z}.M[y\mapsto \mathtt{z}][x\mapsto N]
  &&\text{if } y\in FV(N) \text{ and } x\in FV(M).
\end{align*}
$$

:::

[前回](types-and-logic-1.md)触れたように、入力に対して何かを出力するのが計算で、引数名が異なるだけの λ 抽象は同じものを表すと考える。本ブログでは、簡単のため、非形式的に「それらは構文的に同じである」、つまり $x, y$ が変数のとき項 $\lambda x.M$ と項 $\lambda y.M[x\mapsto y] (y \notin \text{FV}(M))$ が同じだとする。前者を後者に変える操作を **$\alpha$ 変換** と呼ぶ。正確に項を定義したいなら、上の項のような定義で **前項(pre-term)** を定義し、 $\alpha$-同値関係を定義して、全ての前項からなる集合を $\alpha$-同値関係で割ったものを項の集合とする、というアイデアで項を定義する。

---

## まとめ、今後の予定

今回は型無し λ 計算の構文論を定義した。次回は意味論の種類を紹介し、操作的意味論で進める。

## 雑談 (1) 具象構文と抽象構文

todo: untyped lc の具象構文を書き、 parse について書き、 parse された後の抽象構文だけ考えるということを書く

## 雑談 (2) 生成文法周りの理論


## 参考文献
