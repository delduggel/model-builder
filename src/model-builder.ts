import 'reflect-metadata'

interface AnyConstructor<T> extends Function {
  new (...args: Array<any>): T
}

interface ModelBuilder<T> extends Function {
  (any, AnyConstructor): T
}

interface ArrayBuilder<T> extends Function {
  (any, AnyConstructor): T[]
}

const builderKey = 'buildModel:builder'
const typeKey = 'buildModel:type'

function registerModelBuilder<T>(builder: ModelBuilder<T>, type: AnyConstructor<T>): void {
  Reflect.defineMetadata(builderKey, builder, type)
}

function getModelBuilder<T>(type: AnyConstructor<T>): ModelBuilder<T> {
  return Reflect.getMetadata(builderKey, type)
}

function registerPropertyType<A, B>(type: AnyConstructor<A>, property: string, propertyType: AnyConstructor<B>): void {
  Reflect.defineMetadata(typeKey, propertyType, type, property)
}

function getPropertyType<T>(object: T, property: string): AnyConstructor<T> {
  return Reflect.getMetadata(typeKey, object, property)
}

function withProperties<T>(json: any, type: AnyConstructor<T>): T {
  const object: T = new type()
  Object.keys(json).forEach(propertyName => {
    const property = json[propertyName]
    const propertyType = getPropertyType(object, propertyName)
    if (propertyType) {
      object[propertyName] = Array.isArray(property) ? buildArray(property, propertyType) : buildModel(property, propertyType)
    } else {
      object[propertyName] = property
    }
  })
  return object
}

export function withConstructor<T>(json: any, type: AnyConstructor<T>): T {
  return new type(json)
}

registerModelBuilder(withConstructor, Date)

export function buildArray<T>(json: any, type: AnyConstructor<T>): T[] {
  return json.map((value) => buildModel(value, type))
}

export function buildModel<T>(json: any, type: AnyConstructor<T>): T {
  if (json === null || typeof json === 'undefined') {
    return json
  }
  const builder: ModelBuilder<T> = getModelBuilder(type) || withProperties
  return builder(json, type)
}

export function Build<A, B>(propType?: AnyConstructor<B>): Function {
  return (type: AnyConstructor<A>, property: string) => {
    registerPropertyType(type, property, propType || Reflect.getMetadata('design:type', type, property))
  }
}

export function Builder<T>(builder: ModelBuilder<T>): Function {
  return (type: AnyConstructor<T>) => registerModelBuilder(builder, type)
}
