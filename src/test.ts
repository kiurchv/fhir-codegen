import * as A from 'fp-ts/lib/Array'
import * as M from 'fp-ts/lib/Monoid'
import { pipe } from 'fp-ts/lib/pipeable'
import * as path from 'path'
import * as prettier from 'prettier'

import { intercalate } from 'fp-ts/lib/Foldable'
import { Module } from './module'

const CRLF = '\n'

const srcDir = 'src'
const fixtureDir = 'fixtures'
const generatedDir = 'generated'

const prettierOptions: prettier.Options = {
  parser: 'typescript',
  semi: false,
  singleQuote: true,
  printWidth: 120
}

const intercalateCRLF = (strings: Array<string>) => intercalate(M.monoidString, A.array)(CRLF, strings)

function format(content: string): string {
  return prettier.format(content, prettierOptions)
}

function importFixture(resource: string, fixture: string): string {
  return `import * as ${resource} from './${path.join(fixtureDir, resource, fixture)}'`
}

function printTypeImport(name: string): string {
  return `import { ${name} } from '${path.join('..', srcDir, generatedDir, name)}'`
}

function printImports(name: string, resource: string, fixture: string): string {
  const importAssert = `import * as assert from 'assert'`
  const importEither = `import * as E from 'fp-ts/lib/Either'`
  return intercalateCRLF([importAssert, importEither, printTypeImport(name), importFixture(resource, fixture)])
}

function printDescribe(name: string, statements: string): string {
  return intercalateCRLF([`describe('${name}', () => {`, statements, `})`])
}

function printPositiveCase(resource: string, tests: string): string {
  return intercalateCRLF([`it('should decode valid ${resource} resources', () => {`, tests, `})`])
}

function printNegativeCase(resource: string, tests: string): string {
  return intercalateCRLF([`it('should not decode invalid ${resource} resources', () => {`, tests, `})`])
}

function printPositiveAssertion(name: string, resource: string): string {
  return `assert.deepStrictEqual(${name}.decode(${resource}), E.right(${resource}))`
}

function printNegativeAssertion(name: string): string {
  return `assert.ok(E.isLeft(${name}.decode({})))`
}

function printTestCases(name: string, resource: string): string {
  const positiveCase = printPositiveCase(resource, printPositiveAssertion(name, resource))
  const negativeCase = printNegativeCase(resource, printNegativeAssertion(name))
  return intercalateCRLF([positiveCase, negativeCase])
}

/**
 * @since 0.0.1
 */
export function printTest({ name, resource }: Module, fixture: string): string {
  return pipe(
    intercalateCRLF([printImports(name, resource, fixture), '', printDescribe(name, printTestCases(name, resource))]),
    format
  )
}