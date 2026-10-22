#!/usr/bin/env python3



"""
Question:
Write a function to find the longest common prefix string amongst an array of strings.

If there is no common prefix, return an empty string "".

 

Example 1:

Input: strs = ["flower","flow","flight"]
Output: "fl"

Example 2:

Input: strs = ["dog","racecar","car"]
Output: ""
Explanation: There is no common prefix among the input strings.

 

Constraints:

    1 <= strs.length <= 200
    0 <= strs[i].length <= 200
    strs[i] consists of only lowercase English letters if it is non-empty
"""





class Solution:
    def longestCommonPrefix(self, strs: list[str]) -> str:
        prefix = ""
        j=0
        shortest_length = min(len(s) for s in strs)
        while j<shortest_length:
            counter = strs[0][j]
            for i in range(len(strs)):
                if counter == strs[i][j]:
                    continue
                else:
                    return prefix
            prefix += counter
            j+=1
        return prefix          



"""
### Approach
- Compare characters at the same index across all strings.
- Use the first string as the reference.
- Append a character to `prefix` only if all strings match at that index.
- Return `prefix` immediately on a mismatch.
- Stop at the shortest string's length to avoid `IndexError`.

### Key Points
- Prefix must start at index `0`; later matches don't count.
- Empty string in input → return `""`.
- Use `min(len(s) for s in strs)` to find the shortest length.

### Complexity
- Time: `O(n × m)`
- Auxiliary space: `O(1)` (excluding the returned prefix)

`n` = number of strings; `m` = shortest string's length.
"""