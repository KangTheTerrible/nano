// Licensed under the Apache License, Version 2.0 (the 'License'); you may not
// use this file except in compliance with the License. You may obtain a copy of
// the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations under
// the License.

'use strict';

const helpers = require('../../helpers/integration');
const harness = helpers.harness(__filename);
const it = harness.it;
const db = harness.locals.db;

let rev;

it('should be able to insert an atomic design doc', function(assert) {
  const p = db.insert({
    updates: {
      inplace: function(doc, req) {
        const body = JSON.parse(req.body);
        doc[body.field] = body.value;
        return [doc, JSON.stringify(doc)];
      },
      addbaz: function (doc) {
        doc.baz = "biz";
        return [doc, JSON.stringify(doc)];
      }
    }
  }, '_design/update', function(err) {
    assert.equal(err, null, 'should be no problems officer');
    db.insert({'foo': 'baz'}, 'foobar', function(error, foo) {
      assert.equal(error, null, 'stores teh foo');
      assert.equal(foo.ok, true, 'does not have an attitude');
      assert.ok(foo.rev, 'got the revisions');
      rev = foo.rev;
      assert.end();
    });
  });
  assert.ok(helpers.isPromise(p), 'returns Promise');
});

it('should be able to insert atomically', function(assert) {
  const p = db.atomic('update', 'inplace', 'foobar', {
    field: 'foo',
    value: 'bar'
  }, function(error, response) {
    assert.equal(error, null, 'should be able to update');
    assert.equal(response.foo, 'bar', 'and the right value was set');
    assert.end();
  });
  assert.ok(helpers.isPromise(p), 'returns Promise');
});

it('should be able to update atomically without a body', function (assert) {
  const p = db.insert({}, 'baz', function () {
    db.atomic('update', 'addbaz', 'baz', function (error, response) {
      assert.equal(error, null, 'should be able to update');
      assert.equal(response.baz, 'biz', 'and the new field is present');
      assert.end();
    });
  });
  assert.ok(helpers.isPromise(p), 'returns Promise');
});

it('should be able to update with slashes on the id', function(assert) {
  const p = db.insert({'wat': 'wat'}, 'wat/wat', function(error, foo) {
    assert.equal(error, null, 'stores `wat`');
    assert.equal(foo.ok, true, 'response ok');
    db.atomic('update', 'inplace', 'wat/wat', {
      field: 'wat',
      value: 'dawg'
    }, function(error, response) {
      assert.equal(error, null, 'should update');
      assert.equal(response.wat, 'dawg', 'with the right copy');
      assert.end();
    });
  });
  assert.ok(helpers.isPromise(p), 'returns Promise');
});
