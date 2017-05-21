import Bookshelf from './bookshelfClient';
import { pick, intersection } from 'lodash';
import Joi from 'joi';

class modelBase extends Bookshelf.Model{

  constructor(data) {
    super(data);
    super.on('saving', this.validateSave);
  }

  get validate() {
    return (this._validate);
  }

  set validate(validateSetter) {
    this._validate = validateSetter;
  }

  collection(data) {
    console.log(data);
  }

  initValidate (validateDefault) {
    const timestamps = this.hasTimestamps ?
      {
        created_at: Joi.date().optional(),
        updated_at: Joi.date().optional()
      }
      : {};
    return Object.assign(timestamps, validateDefault);
  }

  validateSave (model, attrs, options) {
    let validation;
    // model is not new or update method explicitly set
    if ((model && !model.isNew()) || (options && (options.method === 'update' || options.patch === true))) {
      const optionalKeys = intersection(Object.keys(this.validate), Object.keys(attrs));
      // only validate the keys that are being updated
      const epuredValidateObject = pick(this.validate, optionalKeys);
      validation = Joi.validate(attrs, epuredValidateObject);
    } else {
      validation = Joi.validate(this.attributes, this.validate);
    }

    if (validation.error) {
      validation.error.tableName = this.tableName;

      throw validation.error;
    } else {
      this.set(validation.value);
      return validation.value;
    }
  }

  getData (requiredFields) {
    let fetchedData = {};

    requiredFields.forEach( field => {
        if (field === 'id') {
          fetchedData[field] = this.attributes[this.idAttribute];
        } else {
          fetchedData[field] = this.attributes[field];
        }
      }
    );
    return fetchedData;
  }

  static prepareFilter (filter) {
    if ('id' in filter) {
      filter[this.prototype.idAttribute] = filter.id;
      delete filter.id;
    }
    return filter;
  }

  static create (data, options = {}) {
    return this.forge(data).save(null, options);
  }

  static updateBy(filter, data, options = {}) {
    options = Object.assign({ patch: true, require: true }, options);
    return this.forge(this.prepareFilter(filter)).fetch(options)
      .then(function (model) {
        return model ? model.save(data, options) : undefined
      })
      .catch(err => {
        return err;
      })
  }

  static updateById(id, data, options = {}) {
    options = Object.assign({ patch: true, require: true }, options);
    return this.forge({[this.prototype.idAttribute]: id}).fetch(options)
      .then(function (model) {
        return model ? model.save(data, options) : undefined
      })
  }

  static findAll(filter = {}, options = {}) {
    return this.forge().where(filter).fetchAll(options)
  }

  static findOne(filter, options = {}) {
    options = Object.assign({ require: true }, options);
    return this.forge(filter).fetch(options)
  }

  static destroyBy(filter, options = {}) {
    options = Object.assign({ require: true }, options);
    return this.where(this.prepareFilter(filter))
      .destroy(options)
  }

  static findOrCreate(data, options = {}) {
    return this.findOne(data, Object.assign(options, { require: false }))
      .bind(this)
      .then(function (model) {
        const defaults = options && options.defaults;
        return model || this.create(Object.assign(defaults, data), options)
      })
  }

  static upsert(selectData, updateData, options = {}) {
    return this.findOne(selectData, Object.assign(options, { require: false }))
      .bind(this)
      .then(function (model) {
        return model
          ? model.save(
            updateData,
            Object.assign({ patch: true, method: 'update' }, options)
          )
          : this.create(
            Object.assign(selectData, updateData),
            Object.assign(options, { method: 'insert' })
          )
      })
  }

}

export default modelBase;
