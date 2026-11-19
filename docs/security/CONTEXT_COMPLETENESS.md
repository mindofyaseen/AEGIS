# AEGIS — Context Completeness Gate Mathematical Specification

## 1. Mathematical Formulation
The Context Completeness Gate is a deterministic decision barrier that evaluates whether the empirical evidence collected from an AWS account is sufficient to render a safety determination.

Let $C$ be the set of all executed collectors:
$$C = \{c_1, c_2, \dots, c_n\}$$

Let $C_{\text{essential}}$ be the set of critical collectors without which perimeter and access boundaries cannot be evaluated:
$$C_{\text{essential}} = \{\text{vpc\_collector}, \text{subnet\_collector}, \text{security\_group\_collector}, \text{route\_table\_collector}, \text{iam\_collector}\}$$

Let $S(c) \in \{0, 1\}$ represent the status of collector $c$, where:
$$S(c) = \begin{cases} 1 & \text{if } \text{status}(c) = \text{SUCCESS} \\ 0 & \text{if } \text{status}(c) \in \{\text{FAILED}, \text{PARTIAL}, \text{NOT\_REQUESTED}\} \end{cases}$$

### Base Completeness Ratio ($R_{\text{base}}$)
$$R_{\text{base}} = \frac{1}{|C|} \sum_{c \in C} S(c)$$

### Missing Critical Penalty ($P_{\text{crit}}$)
Let $M_{\text{crit}} = \{c \in C_{\text{essential}} \mid S(c) = 0\}$:
$$P_{\text{crit}} = 0.3 \times |M_{\text{crit}}|$$

### Stale Snapshot Penalty ($P_{\text{stale}}$)
Let $\Delta t$ be the age of the infrastructure snapshot relative to UTC now:
$$P_{\text{stale}} = \begin{cases} 0.4 & \text{if } \Delta t > 24 \text{ hours} \\ 0.0 & \text{otherwise} \end{cases}$$

### Unresolved Dependency Penalty ($P_{\text{dep}}$)
Let $U$ be the set of unresolved inter-resource dependencies:
$$P_{\text{dep}} = 0.1 \times \min(|U|, 3)$$

### Final Completeness Score ($Score$)
$$Score = \max\left(0.0, \min\left(1.0, R_{\text{base}} - P_{\text{crit}} - P_{\text{stale}} - P_{\text{dep}}\right)\right)$$

---

## 2. Verdict Eligibility Gate
An investigation is defined as **Verdict Eligible** ($E = \text{True}$) if and only if all three conditions hold:
1. $|M_{\text{crit}}| = 0$ (Zero missing essential collectors).
2. $P_{\text{stale}} = 0$ (Data age $\le 24$ hours).
3. $Score \ge 0.85$ (Overall score meets or exceeds minimum threshold).

$$E = (|M_{\text{crit}}| = 0) \land (\Delta t \le 24\text{h}) \land (Score \ge 0.85)$$

---

## 3. Enforcement Policy
If $E = \text{False}$, the Policy Engine is mathematically mandated to output:
$$\text{Verdict} = \mathbf{INSUFFICIENT\_CONTEXT}$$

The engine terminates further safety evaluation, refuses merge certification, and details the missing collectors or stale timestamps in the executive report.
