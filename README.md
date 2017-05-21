# bookshelf-modelbase-es6
Full credits should go to [bookshelf-modelbase](https://github.com/bsiddiqui/bookshelf-modelbase) as I just have translated their code.

## Why
[bookshelf-modelbase](https://github.com/bsiddiqui/bookshelf-modelbase) is awesome. However, it does not exist in es6 syntax.

### Please note
* `bookshelf-modelbase-es6` will not force you to use it for all your models.
If you want to use it for some and not others, nothing bad will happen.

* `bookshelf-modelbase-es6` requires you to pass in an initialized instance
of bookshelf, meaning that you can configure bookshelf however you please.
Outside of overriding `bookshelf.Model`, there is nothing you can do to
your bookshelf instance that will break `bookshelf-modelbase-es6`.

### Features
* Adds timestamps (`created_at` and `updated_at`)
* Validate own attributes on save using [Joi](https://github.com/hapijs/joi).
* Naive CRUD methods - `findAll`, `findOne`, `findOrCreate`, `create`, `update`, and `destroy`

## Usage
Please note that you should change the first line of modelBase.js
as the import I use is certainly not the same as you.
```
import Bookshelf from './bookshelfClient';
```
```javascript
import Joi from 'joi';
import modelBase  from '../modelBase';

const userValidate =  {
  name: Joi.string().required(),
  age: Joi.number().required(),
};

class User extends modelBase {

  constructor(data) {
    super(data);
    this._validate = super.initValidate(userValidate);
  }

  get tableName() {
    return 'user';
  }

  get idAttribute() {
    return 'id_user';
  }

  get hasTimestamps() {
    return false;
  }

};

export default User;
```

### API

```
Every time filter is in params, prepareFilter function is used.
Thus you can pass "id" as key to mean your idAttribute.
```


#### model.create

```js
/**
 * Insert a model based on data
 * @param {Object} data
 * @param {Object} [options] Options for model.save
 * @return {Promise(bookshelf.Model)}
 */
create: function (data, options) {
  return this.forge(data).save(null, options);
}
```

#### model.destroyBy

```js
/**
 * Destroy a model by filter
 * @param {Object} filter
 * @param {Object} options
 * @return {Promise(bookshelf.Model)} empty model
 */
destroyBy: function (filter, options = {}) {
    options = Object.assign({ require: true }, options);
    return this.where(this.prepareFilter(filter))
      .destroy(options)
  }
```

#### model.findAll

```javascript
/**
 * Select a collection based on a query
 * @param {Object} filter
 * @param {Object} [options] Options used of model.fetchAll
 * @return {Promise(bookshelf.Collection)} Bookshelf Collection of Models
 */
findAll: function (filter = {}, options = {}) {
    return this.forge().where(filter).fetchAll(options)
  }
```

#### model.findOne

```js
/**
 * Select a model based on a query
 * @param {Object} filter
 * @param {Object} [options] Options for model.fetch
 * @return {Promise(bookshelf.Model)}
 */
findOne: function (filter, options = {}) {
    options = Object.assign({ require: true }, options);
    return this.forge(filter).fetch(options)
  }
```

#### model.findOrCreate
```js
/**
  * Select a model based on data and insert if not found
  * @param {Object} data
  * @param {Object} [options] Options for model.fetch and model.save
  * @param {Object} [options.defaults] Defaults to apply to a create
  * @return {Promise(bookshelf.Model)} single Model
  */
findOrCreate: function (data, options = {}) {
    return this.findOne(data, Object.assign(options, { require: false }))
      .bind(this)
      .then(function (model) {
        const defaults = options && options.defaults;
        return model || this.create(Object.assign(defaults, data), options)
      })
  }
```

#### model.updateBy

```js
/**
 * Update a model based on data
 * @param {Object} filter Used to select rows to be updated
 * @param {Object} data Data to be updated
 * @param {Object} options Options for model.fetch and model.save
 * @return {Promise(bookshelf.Model)}
 */
updateBy: function (filter, data, options = {}) {
    options = Object.assign({ patch: true, require: true }, options);
    return this.forge(this.prepareFilter(filter)).fetch(options)
      .then(function (model) {
        return model ? model.save(data, options) : undefined
      })
      .catch(err => {
        return err;
      })
  }
```

#### model.updateById

```js
/**
 * Update a model based on data
 * @param {Integer} id
 * @param {Object} data Data to be updated
 * @param {Object} options Options for model.fetch and model.save
 * @return {Promise(bookshelf.Model)}
 */
updateById: function (id, data, options = {}) {
    options = Object.assign({ patch: true, require: true }, options);
    return this.forge({[this.prototype.idAttribute]: id}).fetch(options)
      .then(function (model) {
        return model ? model.save(data, options) : undefined
      })
  }
```

#### model.upsert
```js
/**
 * Select a model based on data and update if found, insert if not found
 * @param {Object} selectData Data for select
 * @param {Object} updateData Data for update
 * @param {Object} [options] Options for model.save
 */
upsert: function (selectData, updateData, options = {}) {
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
```

#### instance.getData

```js
/**
 * Used to retrieve data from a class instance
 * @param {Array} fields
 * @return {Object({field: value, ...})}
 */
getData: function (requiredFields) {
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
```
