/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");
const { ExpressError } = require("../expressError");


/** A reservation for a party */

class Reservation {
  constructor({id, customerId, numGuests, startAt, notes}) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  // Notes Getter and Setter 
  get notes() {
    return this._notes;
  }

  set notes(data) {
    this._notes = data || ""
  }

  // numGuests - Getter and Setter
  get numGuests() {
    return this._numGuests;
  }

  set numGuests(data) {
    if (data < 1) throw new ExpressError("Guests must be greater than 0")
    this._numGuests = data
  }

  // customerId - Getter and Setter (can't assign customerId)
  get customerId() {
    return this._customerId
  }

  set customerId(data) {
    if (this._customerId && (data !== this._customerId)) {
      throw new ExpressError("Customer ID already exists");
    }
    this._customerId = data;
  }

  // startAt - Getter and Setter
  get startAt() {
    return this._startAt;
  }

  set startAt(data) {
    if ( isNaN(data) && !(data instanceof Date)) throw new ExpressError("Not a valid start date/time")
    this._startAt = data;
  }

  /** formatter for startAt */

  getformattedStartAt() {
    return moment(this.startAt).format('MMMM Do YYYY, h:mm a');
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
          `SELECT id, 
           customer_id AS "customerId", 
           num_guests AS "numGuests", 
           start_at AS "startAt", 
           notes AS "notes"
         FROM reservations 
         WHERE customer_id = $1 ORDER BY start_at`,
        [customerId]
    );

    return results.rows.map(row => new Reservation(row));
  }

  async save() {
    // If reservation does not exist, create new reservation
    // If reservation exists, update the reservation
    if (this.id === undefined) {
      const data = await db.query(`
                  INSERT INTO reservations (customer_id, start_at, num_guests, notes)
                  VALUES ($1, $2, $3, $4) RETURNING id, customer_id
                  `, [this.customerId, this.startAt, this.numGuests, this.notes])
      this.id = data.rows[0].id
    } else {
      const updatedData = await db.query(`
                          UPDATE reservations SET num_guests = $1, start_at = $2, notes = $3
                          WHERE id = $4 RETURNING id
                          `, [this.numGuests, this.startAt, this.notes, this.id])
    }
  }


  static async get(id) {
    const data = await db.query(`SELECT * FROM reservations WHERE id = $1`, [id]);
    if ( data.results.row[0] = undefined) throw new ExpressError("Reservation not found", 404)
    return new Reservation(data.results.row[0]);  
  
  }


}


module.exports = Reservation;
