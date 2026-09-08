/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom"

import { render } from "@testing-library/react"

import { ThemeProvider } from "@/components/theme-provider"

/** Uncaught exceptions in a DOM listener surface as a window `error` event. */
function captureListenerErrors() {
  const onError = jest.fn()
  window.addEventListener("error", onError)

  return {
    onError,
    dispose: () => window.removeEventListener("error", onError),
  }
}

function dispatchKeyDown(init: KeyboardEventInit, overrides?: PropertyKey[]) {
  const event = new KeyboardEvent("keydown", { bubbles: true, ...init })

  for (const property of overrides ?? []) {
    Object.defineProperty(event, property, { value: undefined })
  }

  window.dispatchEvent(event)
}

describe("ThemeProvider hotkey", () => {
  it("survives a keydown without a key, as fired by browser autofill", () => {
    const { onError, dispose } = captureListenerErrors()
    render(
      <ThemeProvider>
        <div />
      </ThemeProvider>
    )

    // Edge dispatches a synthetic keydown while autofilling credentials; it
    // carries no `key`, even though the DOM type says it always does.
    dispatchKeyDown({}, ["key"])

    expect(onError).not.toHaveBeenCalled()
    dispose()
  })

  it("ignores an ordinary key without throwing", () => {
    const { onError, dispose } = captureListenerErrors()
    render(
      <ThemeProvider>
        <div />
      </ThemeProvider>
    )

    dispatchKeyDown({ key: "a" })

    expect(onError).not.toHaveBeenCalled()
    dispose()
  })

  it("does not throw for the shortcut key itself", () => {
    const { onError, dispose } = captureListenerErrors()
    render(
      <ThemeProvider>
        <div />
      </ThemeProvider>
    )

    dispatchKeyDown({ key: "d" })

    expect(onError).not.toHaveBeenCalled()
    dispose()
  })
})
