/* global loadPyodide */
importScripts('/pyodide/pyodide.js');

let runtimePromise;

function getRuntime() {
  if (!runtimePromise) {
    runtimePromise = loadPyodide({ indexURL: '/pyodide/' });
  }
  return runtimePromise;
}

const HARNESS = `
import contextlib
import io
import json
import math
import traceback

payload = json.loads(__payload_json)
namespace = {}
stdout_buffer = io.StringIO()
results = []
error = None

def values_match(actual, expected):
    if isinstance(actual, bool) or isinstance(expected, bool):
        return actual is expected
    if isinstance(actual, (int, float)) and isinstance(expected, (int, float)):
        return math.isclose(float(actual), float(expected), rel_tol=1e-7, abs_tol=1e-7)
    return actual == expected

try:
    with contextlib.redirect_stdout(stdout_buffer):
        exec(payload["code"], namespace)
        candidate = namespace.get(payload["functionName"])
        if not callable(candidate):
            raise NameError(f'找不到函数 {payload["functionName"]}，请保留题目给出的函数名。')
        for test in payload["tests"]:
            try:
                actual = candidate(*test["args"])
                passed = values_match(actual, test["expected"])
                results.append({
                    "label": test["label"],
                    "passed": passed,
                    "actual": repr(actual),
                    "expected": repr(test["expected"]),
                })
            except Exception as test_error:
                results.append({
                    "label": test["label"],
                    "passed": False,
                    "actual": f'{type(test_error).__name__}: {test_error}',
                    "expected": repr(test["expected"]),
                })
except Exception:
    error = traceback.format_exc(limit=4)

json.dumps({
    "results": results,
    "passed": bool(results) and all(item["passed"] for item in results),
    "stdout": stdout_buffer.getvalue(),
    "error": error,
})
`;

self.onmessage = async (event) => {
  const { id, type, payload } = event.data;
  try {
    const pyodide = await getRuntime();
    if (type === 'warmup') {
      self.postMessage({ id, type: 'ready' });
      return;
    }

    pyodide.globals.set('__payload_json', JSON.stringify(payload));
    const raw = pyodide.runPython(HARNESS);
    pyodide.globals.delete('__payload_json');
    self.postMessage({ id, type: 'result', payload: JSON.parse(raw) });
  } catch (error) {
    self.postMessage({
      id,
      type: 'worker-error',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
