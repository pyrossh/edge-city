import React from 'react';
import { renderToReadableStream } from 'react-dom/server';
import { StreamProvider, SuspenseData } from './hooks';

function wrapStreamEnd(streamEnd, didError) {
  return (
    streamEnd
      // Needed because of the `afterReactBugCatch()` hack above, otherwise `onBoundaryError` triggers after `streamEnd` resolved
      .then(() => new Promise((r) => setTimeout(r, 0)))
      .then(() => !didError)
  )
}

function createBuffer(streamOperations) {
  const buffer = []
  let state = 'UNSTARTED'
  let writePermission = null // Set to `null` because React fails to hydrate if something is injected before the first react write

  return { injectToStream, onBeforeWrite, onBeforeEnd }

  function injectToStream(chunk, options) {
    if (state === 'ENDED') {
      console.error(`Cannot inject following chunk after stream has ended: \`${chunk}\``)
    }
    buffer.push({ chunk, flush: options?.flush })
    flushBuffer()
  }

  function flushBuffer() {
    if (!writePermission) {
      return
    }
    if (buffer.length === 0) {
      return
    }
    if (state !== 'STREAMING') {
      console.error(state === 'UNSTARTED')
      return
    }
    let flushStream = false
    buffer.forEach((bufferEntry) => {
      // assert(streamOperations.operations)
      const { writeChunk } = streamOperations.operations
      writeChunk(bufferEntry.chunk)
      if (bufferEntry.flush) {
        flushStream = true
      }
    })
    buffer.length = 0
    // assert(streamOperations.operations)
    if (flushStream && streamOperations.operations.flush !== null) {
      streamOperations.operations.flush()
    }
  }

  function onBeforeWrite(chunk) {
    // state === 'UNSTARTED' && debug('>>> START')
    state = 'STREAMING'
    if (writePermission) {
      flushBuffer()
    }
    if (writePermission == true || writePermission === null) {
      writePermission = false
      // debug('writePermission =', writePermission)
      setTimeout(() => {
        // debug('>>> setTimeout()')
        writePermission = true
        // debug('writePermission =', writePermission)
        flushBuffer()
      })
    }
  }

  function onBeforeEnd() {
    writePermission = true
    // debug('writePermission =', writePermission)
    flushBuffer()
    // assert(buffer.length === 0)
    state = 'ENDED'
    // debug('>>> END')
  }
}


const createReadableWrapper = (readableFromReact) => {
  const streamOperations = {
    operations: null
  }
  let controllerOfUserStream;
  let onEnded;
  const streamEnd = new Promise((r) => {
    onEnded = () => r()
  })
  const readableForUser = new ReadableStream({
    start(controller) {
      controllerOfUserStream = controller
      onReady(onEnded)
    }
  })
  const { injectToStream, onBeforeWrite, onBeforeEnd } = createBuffer(streamOperations)
  return { readableForUser, streamEnd, injectToStream }
  async function onReady(onEnded) {
    streamOperations.operations = {
      writeChunk(chunk) {
        controllerOfUserStream.enqueue(encodeForWebStream(chunk))
      },
      flush: null
    }

    const reader = readableFromReact.getReader()

    while (true) {
      let result;
      try {
        result = await reader.read()
      } catch (err) {
        controllerOfUserStream.close()
        throw err
      }
      const { value, done } = result
      if (done) {
        break
      }
      onBeforeWrite(value)
      streamOperations.operations.writeChunk(value)
    }

    // Collect `injectToStream()` calls stuck in an async call
    setTimeout(() => {
      onBeforeEnd()
      controllerOfUserStream.close()
      onEnded()
    }, 0)
  }
}

let encoder;
function encodeForWebStream(thing) {
  if (!encoder) {
    encoder = new TextEncoder()
  }
  if (typeof thing === 'string') {
    return encoder.encode(thing)
  }
  return thing
}

export const renderToWebStream = async (element, disable) => {
  let didError = false
  let firstErr = null
  let reactBug = null
  const onError = (err) => {
    didError = true
    firstErr = firstErr || err
    afterReactBugCatch(() => {
      // Is not a React internal error (i.e. a React bug)
      if (err !== reactBug) {
        options.onBoundaryError?.(err)
      }
    })
  }
  const readableOriginal = await renderToReadableStream(element, { onError })
  const { allReady } = readableOriginal
  let promiseResolved = false
  // Upon React internal errors (i.e. React bugs), React rejects `allReady`.
  // React doesn't reject `allReady` upon boundary errors.
  allReady.catch((err) => {
    // debug('react bug')
    didError = true
    firstErr = firstErr || err
    reactBug = err
    // Only log if it wasn't used as rejection for `await renderToStream()`
    if (reactBug !== firstErr || promiseResolved) {
      console.error(reactBug)
    }
  })
  if (didError) throw firstErr
  if (disable) await allReady
  if (didError) throw firstErr
  const { readableForUser, streamEnd, injectToStream } = createReadableWrapper(readableOriginal)
  promiseResolved = true
  return {
    readable: readableForUser,
    streamEnd: wrapStreamEnd(streamEnd, didError),
    injectToStream
  }
}

export const renderToStream = async (element, options = {}) => {
  const buffer = []
  let injectToStream = (chunk) => buffer.push(chunk);
  const disable = options.disable //?? resolveSeoStrategy(options).disableStream)
  const result = await renderToWebStream(React.createElement(
    StreamProvider,
    {
      value: {
        injectToStream: (chunk) => {
          injectToStream(chunk)
        }
      }
    },
    React.createElement(SuspenseData, null, element)
  ), disable, options);
  injectToStream = result.injectToStream
  buffer.forEach((chunk) => injectToStream(chunk));
  buffer.length = 0;
  return result
}