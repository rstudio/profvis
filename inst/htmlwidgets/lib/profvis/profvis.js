/*jshint
  undef:true,
  browser:true,
  devel: true,
  jquery:true,
  strict:false,
  curly:false,
  indent:2
*/
/*global profvis, _ */

profvis = (function() {
  var profvis = {};

  profvis.getLineTimes = function(prof, files) {
    // Calculate times for each file
    var times = _.map(files, function(file) {
      var data = simplifyRef(prof, file.filename);

      data = collapseByLineId(data);
      data = getLineTimesFile(data, file.filename);

      var lines = file.content.split("\n");
      var lineData = [];
      for (var i=0; i<lines.length; i ++) {
        lineData[i] = {
          filename: file.filename,
          lineNum: i + 1,
          content: lines[i],
          time: 0
        };
      }

      _.map(data, function(lineTime) {
        var lineNum = lineTime.lineNum - 1;
        lineData[lineNum].time = lineTime.time;
      });

      return {
        filename: file.filename,
        lineData: lineData
      };
    });

    return times;
  };

  function getLineTimesFile(prof, filename) {
    prof = _.map(prof, function(group) {
      // Calculate the time for each group
      var time = _.reduce(group.value, function(total, x) {
        return total + x.time;
      }, 0);

      group.time = time;
      return group;
    });

    return prof;
  }


  // Simplify an array of profile data objects based on the object's ref's
  // filename and line number combinations.
  function simplifyRef(prof, file) {
    // First find the file and line number in the ref, discarding all other
    // ref content.
    var data = _.map(prof, function(item) {
      // Only modify items where the ref includes the file
      if (item.ref === undefined || !_.includes(item.ref.path, file))
        return null;

      var idx = _.lastIndexOf(item.ref.path, file);
      var lineNum = item.ref.line[idx];
      return {
        file: file,
        lineNum: lineNum,
        time: item.time
      };
    });

    // Remove items that didn't include the file
    data = _.reject(data, function(item) {
      return item === null;
    });

    return data;
  }


  function collapseByLineId(prof) {
    var data = _.groupBy(prof, function(row) {
      return row.file + "#" + row.lineNum;
    });

    data = objToArray(data);

    _.map(data, function(group) {
      group.file = group.value[0].file;
      group.lineNum = group.value[0].lineNum;
    });

    return data;
  }


  // Transform column-oriented data (an object with arrays) to row-oriented data
  // (an array of objects).
  profvis.colToRows = function(x) {
    var colnames = _.keys(x);
    if (colnames.length === 0)
      return {};

    var newdata = [];
    for (var i=0; i < x[colnames[0]].length; i++) {
      var row = {};
      for (var j=0; j < colnames.length; j++) {
        var colname = colnames[j];
        row[colname] = x[colname][i];
      }
      newdata[i] = row;
    }

    return newdata;
  };

  // Given an object of format { a: 1, b: 2 }, return an array of objects with
  // format [ { name: a, value: 1 }, { name: b, value: 2 } ].
  function objToArray(x) {
    x = _.mapValues(x, function(value, key) {
      return {
        name: key,
        value: value
      };
    });

    return _.values(x);
  }

  return profvis;
})();