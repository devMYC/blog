---
title: Square and multiply
publish_date: 2022-06-14 (EDT)
abstract: Technique for fast exponentiation.
---

RSA (Rivest-Shamir-Adleman algorithm) is the most widely used
asymmetric cryptographic schemes. Although RSA is not suitable
for encrypting or decrypting large chunk of data due to slower
performance compare to symmetric ciphers (e.g AES). But there
are still use cases such as key exchange and digital signature
where RSA is commonly used.

RSA relies on the integer factorization problem. It is very
computationally expensive to factor a _large_ number into two
prime numbers because there's no known efficient algorithms
for doing this. The development of quantum computing brings
up concerns for the security of RSA, and people have been
working on new public-key algorithms for the post-quantum era.
But we are not going to focus on the security of RSA in this
post. Instead, we will look at an optimization techinique used
in RSA.

### RSA in a nutshell

A pair of keys are used in RSA. One is the public key that you
can share with anyone on the internet. The other one is the
private key that you should _never_ give it to anyone else.
We denote the public key and private key as \\(k_{pub} = (n, e)\\)
and \\(k_{pri} = d\\), respectively. Now, we can encrypt plaintext
\\(x\\) and decrypt ciphertext \\(y\\) with our keys by performing
the following computations.

$$ y \equiv x^e\ \text{mod}\ n $$
$$ x \equiv y^d\ \text{mod}\ n $$

Okay, that is a lot of variables. The short answer to why the
decryption will give you the original plaintext is that
\\(e \cdot d \equiv 1\ \text{mod}\ \phi(n)\\)
(i.e. \\(e\\) and \\(d\\) are multiplicative inverses of each other).
Therefore, \\(y^d = (x^e)^d = x^{e \cdot d} \equiv x\ \text{mod}\ n\\).
I won't go over the details and math behind RSA as they are
beyond the scope of this post. But If you are curious and want
to know how these keys are generated. I encourage you to read
the related chapters in the textbook listed in the <a href="#references">references</a>.

### Fast exponentiation

As you can see, the main operation needed for encryption and
decryption is to raise the plaintext and ciphertext to the
power of \\(e\\) and \\(d\\), respectively. This might not be
a big deal if the exponent is a relatively small value.
But the exponents are often chosen to be at least \\(2^{1024}\\)
(\\(e\\) could be small in order to accelerate encryption).
Try computing \\(1234567^{23456789}\ \text{mod}\ 3333337\\)
using your favorite programming language (without using the builtin
`pow` function) and see how long it takes to return the answer.

If the exponentiation takes a long time to compute, then RSA will
have very limited usage in practice. But, fortunately, there
is a smart algorithm known as _square and multiply_ that can help
us compute exponentiation faster.

Let's say we want to compute \\(3^{11}\\). The binary representation
of the exponent \\((11)_{10} = (1011)_2\\). The procedure of the
algorithm is simple: we initialize the `result` to be `1`.
Starting from the leftmost (most significant) bit. For each bit, we
_square_ the current `result`. Moreover, if the bit is a `1`,
we _multiply_ the base (\\(3\\) in our case) as well.
The whole process is illustrated by the table below.

| Step | \\(b_i\\) | Square | Multiply |
|------|-----------|--------|----------|
| 1    | 1         | 1      | 3        |
| 2    | 0         | 9      |          |
| 3    | 1         | 81     | 243      |
| 4    | 1         | 59049  | 177147   |

### Implementation

Since it's easier to test if the rightmost (least significant) bit
is `0` or `1`. We can actually implement the algorithm in reverse order.
From the rightmost (least significant) bit. If the bit is a `1`,
we first _multiply_ the current `result` by the base. Also, for every
bit (no matter `0` or `1`), we _square_ the base. Below is the algorithm
implemented in [Go](https://go.dev).

```go
func pow(base float64, exp int) float64 {
        if exp < 0 {
                return 1.0 / pow(base, -exp)
        }
        r := 1.0
        for exp > 0 {
                if exp&1 > 0 {
                        r *= base
                }
                base *= base
                exp >>= 1
        }
        return r
}
```

Voila, our own efficient `pow` function!

### References

* [Understanding Cryptography](https://www.crypto-textbook.com)
* [Lecture by Christof Paar](https://youtu.be/QSlWzKNbKrU)
