export function reportWebVitals(metric: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'production') {
    console.log(metric)
  }
}
