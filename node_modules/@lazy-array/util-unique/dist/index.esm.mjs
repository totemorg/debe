function array_unique_indexOf(n) {
  return n.filter((function(n, r, e) {
    return r === e.indexOf(n);
  }));
}

export { array_unique_indexOf };
//# sourceMappingURL=index.esm.mjs.map
