#!/usr/bin/env python3




"""Problem
You are given a binary tree represented as an array.

For a node at index i:
\[
left(i)=2i+1
\]
\[
right(i)=2i+2
\]
A value of -1 indicates that the node does not exist.

Flatten the tree into a right-linked chain following preorder traversal.

Preorder means:
1. Visit the root.
2. Visit the left subtree.
3. Visit the right subtree.
Print the node values in the resulting order.
Best approach: Preorder traversal
Since the output only asks for the order of values, we don't need to construct actual pointer-based nodes or modify the tree.

We can simply traverse the array representation using a stack.

For a node at index i:
- Process its value.
- Push its right child index.
- Push its left child index.
A stack is last-in, first-out, so the left child is processed before the right child.

Important: Ignore an index if it is outside the array or contains -1.


How does preorder work?
Consider this array:
7
1 2 3 4 5 -1 6

The tree is:
        1
       / \
      2   3
     / \   \
    4   5   6

Preorder traversal visits:
1 2 4 5 3 6

The flattened chain has those values in that order.
Complexity
- Time: O(n)
- Auxiliary space: O(n), for the stack and result.
A subtle point: The problem asks you to print the values of the flattened chain. You do not need to create or modify actual linked-list pointers. Generating the preorder sequence is sufficient.

"""




n = int(input())
a = list(map(int, input().split()))

result = []
stack = [0]

while stack:
    i = stack.pop()

    if i >= n or a[i] == -1:
        continue

    result.append(a[i])

    right = 2 * i + 2
    left = 2 * i + 1

    if right < n:
        stack.append(right)

    if left < n:
        stack.append(left)

print(*result)