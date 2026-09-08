/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom"

import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { OptimizationPanel } from "@/components/assignments/optimization-panel"

const refresh = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}))

const statistics = { total: 10, scheduled: 4, pending: 6 }

function idleStatus() {
  return { task: null, statistics }
}

function processingStatus(progress = 40) {
  return {
    task: {
      id: 1,
      status: "PROCESSING",
      progress,
      errorMessage: null,
      finishedAt: "2024-05-01T12:00:00.000Z",
    },
    statistics,
  }
}

function setup(
  overrides: Partial<Parameters<typeof OptimizationPanel>[0]> = {}
) {
  const startAction = jest.fn().mockResolvedValue({ success: true })
  const statusAction = jest.fn().mockResolvedValue(idleStatus())

  const props = {
    canManage: true,
    initialStatus: idleStatus(),
    startAction,
    statusAction,
    ...overrides,
  }

  render(<OptimizationPanel {...props} />)

  return { startAction, statusAction }
}

beforeEach(() => {
  refresh.mockReset()
})

describe("OptimizationPanel", () => {
  it("shows how many allocations are already scheduled", () => {
    setup()

    expect(screen.getByText("10")).toBeInTheDocument()
    expect(screen.getByText("4")).toBeInTheDocument()
    expect(screen.getByText("6")).toBeInTheDocument()
  })

  it("offers the optimize button to an administrator", () => {
    setup()

    expect(screen.getByRole("button", { name: /otimizar/i })).toBeEnabled()
  })

  it("hides the button from someone who cannot manage", () => {
    setup({ canManage: false })

    expect(
      screen.queryByRole("button", { name: /otimizar/i })
    ).not.toBeInTheDocument()
  })

  it("asks before starting the optimization", async () => {
    const { startAction } = setup()

    await userEvent.click(
      screen.getByRole("button", { name: /otimizar grade/i })
    )

    expect(await screen.findByRole("alertdialog")).toBeInTheDocument()
    expect(startAction).not.toHaveBeenCalled()
  })

  it("shows the progress of a running task", () => {
    setup({ initialStatus: processingStatus(40) })

    expect(screen.getByText("40%")).toBeInTheDocument()
    expect(screen.getByRole("progressbar")).toBeInTheDocument()
  })

  it("does not let a second run start while one is going", () => {
    setup({ initialStatus: processingStatus() })

    expect(screen.getByRole("button", { name: /otimizar/i })).toBeDisabled()
  })

  it("announces a finished run", () => {
    setup({
      initialStatus: {
        task: {
          id: 1,
          status: "COMPLETED",
          progress: 100,
          errorMessage: null,
          finishedAt: "2024-05-01T12:00:00.000Z",
        },
        statistics,
      },
    })

    expect(screen.getByText(/conclu/i)).toBeInTheDocument()
  })

  it("shows why a run failed", () => {
    setup({
      initialStatus: {
        task: {
          id: 1,
          status: "FAILED",
          progress: 30,
          errorMessage: "banco indisponível",
          finishedAt: "2024-05-01T12:00:00.000Z",
        },
        statistics,
      },
    })

    expect(screen.getByText(/banco indispon/i)).toBeInTheDocument()
  })

  it("falls back to a generic message when the failure has no detail", () => {
    setup({
      initialStatus: {
        task: {
          id: 1,
          status: "FAILED",
          progress: 30,
          errorMessage: null,
          finishedAt: "2024-05-01T12:00:00.000Z",
        },
        statistics,
      },
    })

    expect(screen.getByText(/falhou/i)).toBeInTheDocument()
  })

  it("explains that there is nothing to show before the first run", () => {
    setup()

    expect(screen.getByText(/nenhuma otimiza/i)).toBeInTheDocument()
  })

  describe("polling", () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it("keeps asking for the status while the task runs", async () => {
      const statusAction = jest.fn().mockResolvedValue(processingStatus(50))
      setup({ initialStatus: processingStatus(40), statusAction })

      await act(async () => {
        await jest.advanceTimersByTimeAsync(2000)
      })

      expect(statusAction).toHaveBeenCalledTimes(1)

      await act(async () => {
        await jest.advanceTimersByTimeAsync(2000)
      })

      expect(statusAction).toHaveBeenCalledTimes(2)
    })

    it("shows the progress it just read", async () => {
      const statusAction = jest.fn().mockResolvedValue(processingStatus(75))
      setup({ initialStatus: processingStatus(40), statusAction })

      await act(async () => {
        await jest.advanceTimersByTimeAsync(2000)
      })

      expect(screen.getByText("75%")).toBeInTheDocument()
    })

    it("stops once the task is no longer running", async () => {
      const statusAction = jest.fn().mockResolvedValue({
        task: {
          id: 1,
          status: "COMPLETED",
          progress: 100,
          errorMessage: null,
          finishedAt: "2024-05-01T12:00:00.000Z",
        },
        statistics,
      })
      setup({ initialStatus: processingStatus(40), statusAction })

      await act(async () => {
        await jest.advanceTimersByTimeAsync(2000)
      })
      await act(async () => {
        await jest.advanceTimersByTimeAsync(6000)
      })

      expect(statusAction).toHaveBeenCalledTimes(1)
    })

    it("refreshes the page once, so the new grid is visible", async () => {
      const statusAction = jest.fn().mockResolvedValue({
        task: {
          id: 1,
          status: "COMPLETED",
          progress: 100,
          errorMessage: null,
          finishedAt: "2024-05-01T12:00:00.000Z",
        },
        statistics,
      })
      setup({ initialStatus: processingStatus(40), statusAction })

      await act(async () => {
        await jest.advanceTimersByTimeAsync(2000)
      })

      expect(refresh).toHaveBeenCalledTimes(1)
    })

    it("never polls when nothing is running", async () => {
      const statusAction = jest.fn().mockResolvedValue(idleStatus())
      setup({ statusAction })

      await act(async () => {
        await jest.advanceTimersByTimeAsync(10000)
      })

      expect(statusAction).not.toHaveBeenCalled()
    })

    it("keeps polling after a failed read, instead of giving up", async () => {
      const statusAction = jest
        .fn()
        .mockRejectedValueOnce(new Error("rede caiu"))
        .mockResolvedValue(processingStatus(60))
      setup({ initialStatus: processingStatus(40), statusAction })

      await act(async () => {
        await jest.advanceTimersByTimeAsync(2000)
      })
      await act(async () => {
        await jest.advanceTimersByTimeAsync(2000)
      })

      expect(statusAction).toHaveBeenCalledTimes(2)
      expect(screen.getByText("60%")).toBeInTheDocument()
    })
  })
})

describe("confirmation before optimizing", () => {
  it("does not start straight from the button", async () => {
    const { startAction } = setup({
      initialStatus: { task: null, statistics },
    })

    await userEvent.click(
      screen.getByRole("button", { name: /otimizar grade/i })
    )

    expect(startAction).not.toHaveBeenCalled()
  })

  it("asks for confirmation first", async () => {
    setup()

    await userEvent.click(
      screen.getByRole("button", { name: /otimizar grade/i })
    )

    expect(await screen.findByRole("alertdialog")).toBeInTheDocument()
  })

  it("warns that the current timetable will be replaced", async () => {
    setup()

    await userEvent.click(
      screen.getByRole("button", { name: /otimizar grade/i })
    )
    const dialog = await screen.findByRole("alertdialog")

    expect(dialog).toHaveTextContent(/substitu/i)
    expect(dialog).toHaveTextContent("4")
  })

  it("says the action cannot be undone", async () => {
    setup()

    await userEvent.click(
      screen.getByRole("button", { name: /otimizar grade/i })
    )

    expect(await screen.findByRole("alertdialog")).toHaveTextContent(
      /não pode ser desfeita/i
    )
  })

  it("does not threaten anything when there is no timetable yet", async () => {
    setup({
      initialStatus: {
        task: null,
        statistics: { total: 10, scheduled: 0, pending: 10 },
      },
    })

    await userEvent.click(
      screen.getByRole("button", { name: /otimizar grade/i })
    )
    const dialog = await screen.findByRole("alertdialog")

    expect(dialog).not.toHaveTextContent(/substitu/i)
    expect(dialog).toHaveTextContent(/10/)
  })

  it("starts the optimization once confirmed", async () => {
    const { startAction } = setup()

    await userEvent.click(
      screen.getByRole("button", { name: /otimizar grade/i })
    )
    await userEvent.click(
      await screen.findByRole("button", { name: /^otimizar$/i })
    )

    await waitFor(() => expect(startAction).toHaveBeenCalledTimes(1))
  })

  it("does nothing when the confirmation is dismissed", async () => {
    const { startAction } = setup()

    await userEvent.click(
      screen.getByRole("button", { name: /otimizar grade/i })
    )
    await userEvent.click(
      await screen.findByRole("button", { name: /cancelar/i })
    )

    expect(startAction).not.toHaveBeenCalled()
  })

  it("closes the confirmation after it starts", async () => {
    setup()

    await userEvent.click(
      screen.getByRole("button", { name: /otimizar grade/i })
    )
    await userEvent.click(
      await screen.findByRole("button", { name: /^otimizar$/i })
    )

    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    )
  })

  it("cannot be opened while a run is in flight", () => {
    setup({ initialStatus: processingStatus() })

    expect(
      screen.getByRole("button", { name: /otimizar grade/i })
    ).toBeDisabled()
  })
})
