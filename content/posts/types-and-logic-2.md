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

型無し λ 計算の構文として、前項と値を以下のように定義する。

:::definition{#untyped-lc-term-long title="前項"}

変数記号の集合 $V$ を考える。

型無し λ 計算の **前項(pre-term)** は、以下のように再帰的に定義される。


- $x\in V$ であるとき、 **変数(variable)** $x$ は前項である。
- $M$ が前項であるとき、 **λ 抽象(abstraction)** $(\lambda x.M)$ は前項である。
- $M_1, M_2$ が前項であるとき、**適用(application)** $(M_1 M_2)$ は前項である。
- 上記以外は前項ではない。

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

:::notation

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

また、前項を全て集めた集合を $\Lambda^-$ と書く。

:::example

$V=\{\mathtt{x}, \mathtt{y}\}$ とする。

- a

:::



---

値を定義する。

:::definition{#untyped-lc-value title="値"}

$$
\begin{align*}
v ::=&   &\quad (\text{values}) \\\\
  \quad \mid\ &\lambda x.M &\quad (\text{abstraction value}) \\\\
\end{align*}
$$

:::
