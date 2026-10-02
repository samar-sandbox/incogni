export class DbService {
  /**
   * @param {import("mongoose").Model} model - The Mongoose model this service operates on.
   */
  constructor(model) {
    this.model = model;
  }

  /**
   * Applies common find-query modifiers (select, populate, lean) to a query.
   * @param {import("mongoose").Query} query
   * @param {Object} [options={}]
   * @param {string|string[]|Object} [options.select] - Field projection.
   * @param {string|Object|Array} [options.populate] - Population config.
   * @param {boolean} [options.lean] - Return plain JS objects instead of documents.
   * @returns {import("mongoose").Query}
   */
  #addFindOptions(query, options = {}) {
    const { select, populate, lean = true } = options;

    if (select) query = query.select(select);
    if (populate) query = query.populate(populate);
    if (lean) query = query.lean();

    return query;
  }

  /**
   * Creates a single document.
   * @param {Object} data - The document data.
   * @param {Object} [options={}] - Options passed to `Model.create` (e.g. `{ session }`).
   * @returns {Promise<import("mongoose").Document>} The created document.
   */
  async create(data, options = {}) {
    const docs = await this.model.create([data], options);
    return docs[0];
  }

  /**
   * Creates multiple documents.
   * @param {Object[]} data - Array of document data.
   * @param {Object} [options={}] - Options passed to `Model.create`.
   * @returns {Promise<import("mongoose").Document[]>} The created documents.
   */
  async createMany(data, options = {}) {
    return this.model.create(data, options);
  }

  /**
   * Deletes all documents matching a filter.
   * @param {Object} filter - Query filter.
   * @param {Object} [options={}]
   * @returns {Promise<{deletedCount: number}>}
   */
  async deleteMany(filter, options = {}) {
    const result = await this.model.deleteMany(filter, options);
    return { deletedCount: result.deletedCount };
  }

  /**
   * Deletes a single document matching a filter.
   * @param {Object} filter - Query filter.
   * @param {Object} [options={}]
   * @returns {Promise<{deletedCount: number}>}
   */
  async deleteOne(filter, options = {}) {
    const result = await this.model.deleteOne(filter, options);
    return { deletedCount: result.deletedCount };
  }

  /**
   * Finds multiple documents matching a filter.
   * @param {Object} [filter={}] - Query filter.
   * @param {Object} [options={}]
   * @param {Object} [options.sort] - Sort spec.
   * @param {number} [options.skip] - Number of docs to skip.
   * @param {number} [options.limit] - Max docs to return.
   * @param {string|string[]|Object} [options.select]
   * @param {string|Object|Array} [options.populate]
   * @param {boolean} [options.lean]
   * @returns {Promise<import("mongoose").Document[]>}
   */
  async findMany(filter = {}, options = {}) {
    const { sort, skip, limit, ...rest } = options;

    let query = this.model.find(filter);

    query = this.#addFindOptions(query, rest);

    if (sort) query = query.sort(sort);
    if (typeof skip === "number") query = query.skip(skip);
    if (typeof limit === "number") query = query.limit(limit);

    return query.exec();
  }

  /**
   * Finds a document by its ID.
   * @param {string|import("mongoose").Types.ObjectId} id
   * @param {Object} [options={}]
   * @param {string|string[]|Object} [options.select]
   * @param {string|Object|Array} [options.populate]
   * @param {boolean} [options.lean]
   * @returns {Promise<import("mongoose").Document|null>}
   */
  async findById(id, options = {}) {
    let query = this.model.findById(id);

    query = this.#addFindOptions(query, options);

    return query.exec();
  }

  /**
   * Finds a document by ID and deletes it, returning the deleted document.
   * @param {string|import("mongoose").Types.ObjectId} id
   * @param {Object} [options={}]
   * @returns {Promise<import("mongoose").Document|null>} The deleted document.
   */
  async findByIdAndDelete(id, options = {}) {
    let query = this.model.findByIdAndDelete(id);

    query = this.#addFindOptions(query, options);

    return query.exec();
  }

  /**
   * Finds a document by ID and updates it, returning the updated document by default.
   * @param {string|import("mongoose").Types.ObjectId} id
   * @param {Object} update - Update to apply.
   * @param {Object} [options={}]
   * @returns {Promise<import("mongoose").Document|null>} The updated document.
   */
  async findByIdAndUpdate(id, update, options = {}) {
    const { select, populate, lean, ...rest } = options;

    let query = this.model.findByIdAndUpdate(id, update, {
      runValidators: true,
      returnDocument: "after",
      ...rest,
    });

    query = this.#addFindOptions(query, { select, populate, lean });

    return query.exec();
  }

  /**
   * Finds a single document matching a filter.
   * @param {Object} [filter={}]
   * @param {Object} [options={}]
   * @returns {Promise<import("mongoose").Document|null>}
   */
  async findOne(filter = {}, options = {}) {
    let query = this.model.findOne(filter);

    query = this.#addFindOptions(query, options);

    return query.exec();
  }

  /**
   * Finds one document matching a filter and deletes it, returning the deleted document.
   * @param {Object} [filter={}]
   * @param {Object} [options={}]
   * @returns {Promise<import("mongoose").Document|null>}
   */
  async findOneAndDelete(filter = {}, options = {}) {
    let query = this.model.findOneAndDelete(filter);

    query = this.#addFindOptions(query, options);

    return query.exec();
  }

  /**
   * Finds one document matching a filter and replaces it entirely.
   * @param {Object} [filter={}]
   * @param {Object} replacement - Full replacement document.
   * @param {Object} [options={}]
   * @returns {Promise<import("mongoose").Document|null>} The replaced document.
   */
  async findOneAndReplace(filter = {}, replacement, options = {}) {
    const { populate, select, lean, ...rest } = options;

    let query = this.model.findOneAndReplace(filter, replacement, {
      runValidators: true,
      returnDocument: "after",
      ...rest,
    });

    query = this.#addFindOptions(query, { populate, select, lean });

    return query.exec();
  }

  /**
   * Finds one document matching a filter and updates it.
   * @param {Object} [filter={}]
   * @param {Object} update - Update to apply.
   * @param {Object} [options={}]
   * @returns {Promise<import("mongoose").Document|null>} The updated document.
   */
  async findOneAndUpdate(filter = {}, update, options = {}) {
    const { populate, select, lean, ...rest } = options;

    let query = this.model.findOneAndUpdate(filter, update, {
      runValidators: true,
      returnDocument: "after",
      ...rest,
    });

    query = this.#addFindOptions(query, { populate, select, lean });

    return query.exec();
  }

  /**
   * Finds documents with page-based pagination.
   * @param {Object} [filter={}]
   * @param {Object} [options={}]
   * @param {number} [options.page=1] - 1-indexed page number.
   * @param {number} [options.limit=10] - Docs per page.
   * @param {Object} [options.sort={createdAt: -1}]
   * @returns {Promise<{data: import("mongoose").Document[], total: number, page: number, limit: number, totalPages: number}>}
   */
  async findWithPagination(filter = {}, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 }, ...rest } = options;

    const skip = (page - 1) * limit;

    let query = this.model.find(filter).sort(sort).skip(skip).limit(limit);

    query = this.#addFindOptions(query, rest);

    const [data, total] = await Promise.all([
      query.exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Updates all documents matching a filter.
   * @param {Object} [filter={}]
   * @param {Object} update - Update to apply.
   * @param {Object} [options={}]
   * @returns {Promise<import("mongoose").UpdateWriteOpResult>}
   */
  async updateMany(filter = {}, update, options = {}) {
    return this.model.updateMany(filter, update, {
      runValidators: true,
      ...options,
    });
  }

  /**
   * Updates a single document matching a filter.
   * @param {Object} [filter={}]
   * @param {Object} update - Update to apply.
   * @param {Object} [options={}]
   * @returns {Promise<import("mongoose").UpdateWriteOpResult>}
   */
  async updateOne(filter = {}, update, options = {}) {
    return this.model.updateOne(filter, update, {
      runValidators: true,
      ...options,
    });
  }

  /**
   * Counts documents matching a filter.
   * @param {Object} [filter={}]
   * @returns {Promise<number>}
   */
  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }

  /**
   * Checks whether any document matches a filter.
   * @param {Object} filter
   * @returns {Promise<{_id: import("mongoose").Types.ObjectId}|null>}
   */
  async exists(filter) {
    return this.model.exists(filter);
  }

  /**
   * Runs an aggregation pipeline.
   * @param {Object[]} [pipeline=[]]
   * @param {Object} [options={}]
   * @returns {Promise<Object[]>}
   */
  async aggregate(pipeline = [], options = {}) {
    return this.model.aggregate(pipeline, options);
  }

  /**
   *
   * @param {any} obj The object to validate against the model schema
   * @returns The casted-and-validated copy of `obj`
   */
  async validate(obj) {
    return this.model.validate(obj);
  }
}
