---
title: Binary search
publish_date: 2022-06-13 (EDT)
abstract: Let's play the guessing game.
cover_html: <svg class='diagram' xmlns='http://www.w3.org/2000/svg' version='1.1' height='105' width='544'><g transform='translate(8,16)'><path d='M 0,48 L 48,48' fill='none' stroke='currentColor'></path><path d='M 48,48 L 96,48' fill='none' stroke='currentColor'></path><path d='M 96,48 L 144,48' fill='none' stroke='currentColor'></path><path d='M 144,48 L 192,48' fill='none' stroke='currentColor'></path><path d='M 192,48 L 240,48' fill='none' stroke='currentColor'></path><path d='M 240,48 L 288,48' fill='none' stroke='currentColor'></path><path d='M 288,48 L 336,48' fill='none' stroke='currentColor'></path><path d='M 336,48 L 384,48' fill='none' stroke='currentColor'></path><path d='M 384,48 L 432,48' fill='none' stroke='currentColor'></path><path d='M 432,48 L 480,48' fill='none' stroke='currentColor'></path><path d='M 480,48 L 528,48' fill='none' stroke='currentColor'></path><path d='M 0,80 L 48,80' fill='none' stroke='currentColor'></path><path d='M 48,80 L 96,80' fill='none' stroke='currentColor'></path><path d='M 96,80 L 144,80' fill='none' stroke='currentColor'></path><path d='M 144,80 L 192,80' fill='none' stroke='currentColor'></path><path d='M 192,80 L 240,80' fill='none' stroke='currentColor'></path><path d='M 240,80 L 288,80' fill='none' stroke='currentColor'></path><path d='M 288,80 L 336,80' fill='none' stroke='currentColor'></path><path d='M 336,80 L 384,80' fill='none' stroke='currentColor'></path><path d='M 384,80 L 432,80' fill='none' stroke='currentColor'></path><path d='M 432,80 L 480,80' fill='none' stroke='currentColor'></path><path d='M 480,80 L 528,80' fill='none' stroke='currentColor'></path><path d='M 0,48 L 0,80' fill='none' stroke='currentColor'></path><path d='M 24,16 L 24,32' fill='none' stroke='currentColor'></path><path d='M 48,48 L 48,80' fill='none' stroke='currentColor'></path><path d='M 96,48 L 96,80' fill='none' stroke='currentColor'></path><path d='M 144,48 L 144,80' fill='none' stroke='currentColor'></path><path d='M 192,48 L 192,80' fill='none' stroke='currentColor'></path><path d='M 240,48 L 240,80' fill='none' stroke='currentColor'></path><path d='M 264,16 L 264,32' fill='none' stroke='currentColor'></path><path d='M 288,48 L 288,80' fill='none' stroke='currentColor'></path><path d='M 336,48 L 336,80' fill='none' stroke='currentColor'></path><path d='M 384,48 L 384,80' fill='none' stroke='currentColor'></path><path d='M 432,48 L 432,80' fill='none' stroke='currentColor'></path><path d='M 480,48 L 480,80' fill='none' stroke='currentColor'></path><path d='M 504,16 L 504,32' fill='none' stroke='currentColor'></path><path d='M 528,48 L 528,80' fill='none' stroke='currentColor'></path><path d='M 24,32 L 24,40' fill='none' stroke='currentColor'></path><polygon points='40.000000,32.000000 28.000000,26.400000 28.000000,37.599998' fill='currentColor' transform='rotate(90.000000, 24.000000, 32.000000)'></polygon><path d='M 264,32 L 264,40' fill='none' stroke='currentColor'></path><polygon points='280.000000,32.000000 268.000000,26.400000 268.000000,37.599998' fill='currentColor' transform='rotate(90.000000, 264.000000, 32.000000)'></polygon><path d='M 504,32 L 504,40' fill='none' stroke='currentColor'></path><polygon points='520.000000,32.000000 508.000000,26.400000 508.000000,37.599998' fill='currentColor' transform='rotate(90.000000, 504.000000, 32.000000)'></polygon><text text-anchor='middle' x='24' y='4' fill='currentColor' style='font-size:1em'>L</text><text text-anchor='middle' x='24' y='68' fill='currentColor' style='font-size:1em'>0</text><text text-anchor='middle' x='72' y='68' fill='currentColor' style='font-size:1em'>1</text><text text-anchor='middle' x='120' y='68' fill='currentColor' style='font-size:1em'>2</text><text text-anchor='middle' x='168' y='68' fill='currentColor' style='font-size:1em'>3</text><text text-anchor='middle' x='216' y='68' fill='currentColor' style='font-size:1em'>4</text><text text-anchor='middle' x='264' y='4' fill='currentColor' style='font-size:1em'>M</text><text text-anchor='middle' x='264' y='68' fill='currentColor' style='font-size:1em'>5</text><text text-anchor='middle' x='312' y='68' fill='currentColor' style='font-size:1em'>6</text><text text-anchor='middle' x='360' y='68' fill='currentColor' style='font-size:1em'>7</text><text text-anchor='middle' x='408' y='68' fill='currentColor' style='font-size:1em'>8</text><text text-anchor='middle' x='456' y='68' fill='currentColor' style='font-size:1em'>9</text><text text-anchor='middle' x='496' y='68' fill='currentColor' style='font-size:1em'>1</text><text text-anchor='middle' x='504' y='4' fill='currentColor' style='font-size:1em'>R</text><text text-anchor='middle' x='512' y='68' fill='currentColor' style='font-size:1em'>0</text></g></svg>
---

Have you ever played the guessing game? The rule of the game is simple.
A number is randomly picked from a given range (e.g. between 1 and 100).
Now you need to guess what that secret number is. If we don't get any
feedback other than *correct* or *incorrect* after each guess, then all
we can do is just to try different numbers randomly in the range, or try
numbers one by one sequentially till we find the answer. These strategies
do work because the range is finite. But, what if the number of times we
are allow to guess is limited (e.g. 10 guesses). Then those strategies
might only work occasionally.

We can actually do much better when some extra information is given after
each guess. If we can be told whether our guess is greater or less than
the correct answer, then we can always pick the middle number from the
remaining entries. This is really powerful because each time we will shrink
the range by half. I don't quite remember how I learned this technique when
playing the guessing game with my friends back in the days when I was a
little kid. And only after I started studying computer science, I finally
knew the official name for this technique&mdash;binary search.

### Implementation

Here's the "canonical form" implementation of binary search for finding the
position of a target value in a _sorted_ array, returning `-1` indicates the
abcense of the target value.

```go
func bsearch(nums []int, target int) int {
        lo, hi := 0, len(nums)-1
        for lo <= hi {
                mid := lo + (hi-lo)/2
                if nums[mid] == target {
                        return mid
                }
                if nums[mid] < target {
                        lo = mid + 1
                } else {
                        hi = mid - 1
                }
        }
        return -1
}
```

The problem of the code snippet above is that it can only be used for equility
test between an element and the target value. But sometimes we might also need
to find the biggest/smallest value that is less/greater than a target value, or
maybe we want to find the first/last occurrence of a value in a _sorted_ array.

The standard library of [Go](https://go.dev) provides a `Search` method under
the `sort` package which has the following signature:

```go
func Search(n int, f func(int) bool) int
```

Given an integer `n` and a predicate function `f`. It will return the leftmost
index `i` such that `f(i) == true` where `i` is in range `[0, n)`. But instead
of returning `-1` as the "not found" value, it returns `n`. This is really
convenient for finding the lower bound that satisfies the predicate. And for
the upper bound, I am not sure if there's a better way of doing this, but I
usually just invert the logic defined in the predicate function. But this will
return the index `j` of the leftmost element that does _not_ satisfy the condition.
So I end up having to check if `j-1` exists.

Another constraint of this `Search` method is that the range only starts from `0`.
Maybe we can do some offset tricks in the predicate function so we can search
any subarray of the original array (again, I am not sure if this is the best
practice). So, sometimes I will just implement my own search functions if it will
make my life easier.

```go
func lowerbound(start, end int, pred func(int) bool) int {
        // end+1 will be the "not found" value
        lo, hi := start, end+1
        for lo < hi {
                mid := lo + (hi-lo)/2
                if !pred(mid) {
                        lo = mid + 1
                } else {
                        hi = mid
                }
        }
        return lo
}

func upperbound(start, end int, pred func(int) bool) int {
        // start-1 will be the "not found" value
        lo, hi := start-1, end
        for lo < hi {
                mid := lo + (hi-lo)/2 + 1
                if !pred(mid) {
                        hi = mid - 1
                } else {
                        lo = mid
                }
        }
        return lo
}
```

### Conclusion

Binary search is one of those simple and powerful algorithms. If you leverage
it in appropriate situations, it can really help you speed up things because its
`log(n)` runtime complexity. Also, there could be more variations than the ones
I mentioned above. So I will keep exploring and update this post once I find
something interesting.
