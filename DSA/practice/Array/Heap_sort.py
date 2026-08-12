#!/usr/bin/env python3

def hepify(arr, n, i):
    size = len(arr)
    if size%2 == 0:
        l=arr[size-1]
        parent = arr[size//2]
    else:
        l = arr[size-2]
        r = arr[size-1]
        parent = arr[size//2]
    if l > parent:
        l, parent = parent, l
    if r > parent:
        r, parent = parent, r


    def heap_sort():
        return None
 
