---
title: 型無し $\lambda$ 計算 (2) 構文論
status: draft
tags: [型理論]
series: types-and-logic
series_order: 2
date: 2026-05-17
---

[前回](types-and-logic-1.md)は、型無し λ 計算の意味を日本語で考え、慣れた。今回から、型無し λ 計算の体系の定義をする。

### 構文論

型無し λ 計算の構文を定義していく。 [前回](types-and-logic-1.md)触れたように、入力に対して何かを出力するのが計算で、引数名が異なるだけの λ 抽象は同じものを表すと考える。これを構文に反映するため、まず前項を定義し、 $\alpha$-同値関係を定義して、前項の集合を $\alpha$-同値関係で割ったものを項の集合とする、というアイデアで項を定義する。

以下では、変数記号の集合 $V$ を考える。

:::definition{#untyped-lc-term-long title="前項"}

型無し λ 計算の **前項(pre-term)** を、以下のように再帰的に定義する。

- $x\in V$ であるとき、 **変数(variable)** $x$ は前項である。
- $M$ が前項であるとき、 **λ 抽象(abstraction)** $(\lambda x.M)$ は前項である。
- $M_1, M_2$ が前項であるとき、**適用(application)** $(M_1 M_2)$ は前項である。
- 上記のみが前項である。

:::

このような定義を省略して、次のように書くことがある。これを **BNF(バッカス＝ナウア記法)** と言う。

:::definition{#untyped-lc-term title="前項"}

$$
\begin{align*}
M ::=&   &\quad (\text{pre-term}) \\\\
  \quad \mid\ &x &\quad (\text{variable}) \\\\
  \quad \mid\ &(\lambda x.M) &\quad (\text{abstraction}) \\\\
  \quad \mid\ &(M_1 M_2) &\quad (\text{application}) \\\\
  & &(x\in V)
\end{align*}
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

最も外側の括弧は省略する。

:::

また、前項を全て集めた集合を $\Lambda^-$ と置く。

:::example{#test-example title="λ 項"}

$V=\{\mathtt{x}, \mathtt{y}\}$ とする。

- a

:::

:::definition{#untyped-lc-fv title="自由変数"}
$M\in \Lambda^-$ に対し集合 $FV(M)$ を以下のように定義し、その要素を $M$ の **自由変数(free variable)** と呼ぶ。

$$
\begin{align*}
FV(x) &= \{x\} \\\\
FV(\lambda x.M) &= FV(M) \setminus \{x\} \\\\
FV(M_1 M_2) &= FV(M_1) \cup FV(M_2)
\end{align*}
$$

:::

$FV(M)=\emptyset$ であるとき、 $M$ は **閉じている(closed)** と言う。そうでないとき、 $M$ は **開いている(open)** と言う。

:::definition{#untyped-lc-substitution title="代入"}
d
:::

---

値を定義する。

:::definition{#untyped-lc-value title="値"}

$$
\begin{align*}
v ::=& &\quad (\text{values}) \\\\
\quad \mid\ &\lambda x.M &\quad (\text{abstraction value}) \\\\
\end{align*}
$$

:::

$$
$$

## まとめ、今後の予定

## 雑談 (1) 具象構文と抽象構文

todo: untyped lc の具象構文を書き、 parse について書き、 parse された後の抽象構文だけ考えるということを書く
