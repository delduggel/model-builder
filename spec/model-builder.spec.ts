import 'jasmine'
import 'reflect-metadata'
import {Build, Builder, buildArray, buildModel, withConstructor} from '../src/model-builder'

describe('#buildModel', () => {

  it('should pass through null and undefined', () => {
    [null, undefined].forEach(input => {
      expect(buildModel(input, Date)).toEqual(input)
    })
  })

  it('should convert string to Date', () => {
    ['2015-01-02T12:12:12.123Z', '2015-12-12'].forEach(validDate => {
      const date = buildModel(validDate, Date)
      expect(date).toEqual(jasmine.any(Date))
      expect(date.getFullYear()).toEqual(2015)
    })
  })

  it('should create an invalid Date if string is not parsable', () => {
    ['', 'gibberish'].forEach(invalidDate => {
      expect(buildModel(invalidDate, Date).toString()).toEqual('Invalid Date')
    })
  })

  it('should build a model with basic properties without annotations', () => {
    class BasicObject {
      str: string
      num: number
      bool: boolean
      nil: any
      undef: any
      obj: Object
      array: any[]
    }

    const expected = new BasicObject()
    expected.str = 'string'
    expected.num = 1001
    expected.bool = true
    expected.nil = null
    expected.undef = undefined
    expected.obj = { hidey: 'ho'}
    expected.array = ['brown', 2, false, null]

    const input = {
      str: 'string',
      num: 1001,
      bool: true,
      nil: null,
      undef: undefined,
      obj: { hidey: 'ho'},
      array: ['brown', 2, false, null]
    }
    expect(buildModel(input, BasicObject)).toEqual(expected)
  })

  it('should build a model with class builder annotation', () => {
    @Builder(withConstructor)
    class Taco {
      constructor(public ingredients: any) {}
    }
    const expected = { greens: 'head lettuce', meat: 'beef', shells: 'corn', cheese: 'of course'}
    expect(buildModel(expected, Taco).ingredients).toEqual(expected)
  })

  it('should build properties using annotation by detecting the type', () => {
    class Turkey {
      @Build() leg: Date
    }
    expect(buildModel({ leg: '2015-01-02T12:12:12.123Z'}, Turkey).leg.getFullYear()).toEqual(2015)
  })

  it('should build properties using type provided in annotation', () => {
    class Duck {
      quack: string
    }
    class Goose {
      quack: string
    }
    class Pond {
      @Build(Duck) bird: Goose
    }
    const model = buildModel({ bird: { quack: 'meow' } }, Pond)
    expect(model.bird.quack).toEqual('meow')
    expect(model.bird).toEqual(jasmine.any(Duck))
    expect(model.bird).not.toEqual(jasmine.any(Goose))
  })

  it('should build an array property using type provided in annotation', () => {
    class Tour {
      @Build(Date) dates: Date[]
    }
    const tour = buildModel({ dates: ['2015-04-23', '2015-05-13'] }, Tour)
    tour.dates.forEach(date => {
      expect(date).toEqual(jasmine.any(Date))
      expect(date.getFullYear()).toEqual(2015)
    })
  })

  it('should build nested models', () => {
    class KneeBone {
      name: string
    }
    class ThighBone {
      name: string
      @Build() connectedToThe: KneeBone
    }
    class HipBone {
      name: string
      @Build() connectedToThe: ThighBone
    }

    const expected = new HipBone()
    expected.name = 'hip'
    expected.connectedToThe = new ThighBone()
    expected.connectedToThe.name = 'thigh'
    expected.connectedToThe.connectedToThe = new KneeBone()
    expected.connectedToThe.connectedToThe.name = 'knee'

    const json = {
      name: 'hip',
      connectedToThe: {
        name: 'thigh',
        connectedToThe: {
          name: 'knee'
        }
      }
    }
    const hip = expect(buildModel(json, HipBone)).toEqual(expected)
  })

  it('hopefully should work for subclasses', () => {
    class Parent {
      @Build() dob: Date
    }
    class Child extends Parent {}
    expect(buildModel({ dob: '2015-04-23'}, Child).dob).toEqual(jasmine.any(Date))
  })
})

describe('#buildArray', () => {

  it('should build an array of models', () => {
    const dateStrings = ['2015-01-01T12:12:12.123Z', '2015-01-02T12:12:12.123Z']
    const expected = dateStrings.map(date => new Date(date))
    expect(buildArray(dateStrings, Date)).toEqual(expected)
  })

})
