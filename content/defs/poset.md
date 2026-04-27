---
id: poset
title: 半順序集合
aliases: [半順序, 半順序集合]
status: draft
tags: [集合論]
---

:::definition
**半順序集合** (poset) とは、集合 $P$ と二項関係 $\leq\, \subseteq P \times P$ の組 $(P,\leq)$ であって、以下をすべて満たすものをいう。

1. **反射律**: 任意の $x \in P$ に対して $x \leq x$
2. **反対称律**: $x \leq y$ かつ $y \leq x$ ならば $x = y$
3. **推移律**: $x \leq y$ かつ $y \leq z$ ならば $x \leq z$
:::

全順序（*total order*）は半順序の特別な場合であり、任意の二元が比較可能な半順序である。
