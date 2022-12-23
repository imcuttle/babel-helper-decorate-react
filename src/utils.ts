export const isScopeDepthPassed = (path, detectScopeDepth?: number) => {
  if (detectScopeDepth == null || detectScopeDepth < 0) {
    return true
  }

  let t = detectScopeDepth
  let scope = path.scope
  do {
    scope = scope.parent
    if (t === 0 && !scope) {
      return true
    }
    t--
  } while (t >= 0 && scope)
  return false
}

export const replaceAdvancedWith = (path: import('@babel/traverse').NodePath, replacement: any) => {
  const rlt = path.replaceWith(replacement)
  return rlt
}
