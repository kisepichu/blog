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

型無し λ 計算の構文として、項と値を以下のように定義する。

:::definition{#untyped-lc-term title="項"}
項
:::

$$
\begin{align*}
t ::=&   &\quad (\text{terms}) \\\\
  \quad \mid\ &x &\quad (\text{variable}) \\\\
  \quad \mid\ &\lambda x.M &\quad (\text{abstraction}) \\\\
  \quad \mid\ &M_1 M_2 &\quad (\text{application}) \\\\
  \\\\
v ::=&   &\quad (\text{values}) \\\\
  \quad \mid\ &\lambda.t &\quad (\text{abstraction value}) \\\\
\end{align*}
$$
