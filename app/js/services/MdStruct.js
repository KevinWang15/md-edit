angular.module('md-edit.services')
    .service('MdStruct', function ($sce, $timeout, $rootScope, $q, FileService) {

        var self = this;

        this.mdblocks = [0];
        this.eleblocks = [0];


        function getRow(md, index) {
            var row = 0;
            for (var i = 0; i < index; i++) {
                if (md[i] == '\n')
                    row++;
            }
            return row + 1;
        }

        this.getScrollTop = function (row) {
            row++;
            for (var mdblockIndex = 0; mdblockIndex < self.mdblocks.length; mdblockIndex++) {
                if (self.mdblocks[mdblockIndex] > row)
                    break;
            }

            if (mdblockIndex < self.mdblocks.length)
                mdblockIndex--;

            return self.eleblocks[mdblockIndex]
                + ( self.eleblocks[mdblockIndex + 1] - self.eleblocks[mdblockIndex] )
                * (row - self.mdblocks[mdblockIndex] ) / (self.mdblocks[mdblockIndex + 1] - self.mdblocks[mdblockIndex] );
        };

        this.buildMap = function (md, html, $preview) {
            var deferred = $q.defer();

            var h1regexp1 = /^# (.+)/mg;
            var match = h1regexp1.exec(md);

            self.mdblocks.splice(0);
            self.eleblocks.splice(0);

            self.mdblocks.push(0);
            self.eleblocks.push(0);

            while (match != null) {
                // console.log(match[1], getRow(md, match.index));
                self.mdblocks.push(getRow(md, match.index));
                match = h1regexp1.exec(md);
            }
            var h1regexp2 = /^(.+)\r?\n={2,}/mg;

            match = h1regexp2.exec(md);

            while (match != null) {
                // console.log(match[1], getRow(md, match.index));
                self.mdblocks.push(getRow(md, match.index));
                match = h1regexp2.exec(md);
            }

            self.mdblocks.push(getRow(md, md.length));

            $timeout(function () {
                var elements = $('h1', $preview);
                for (var i = 0; i < elements.length; i++) {
                    // console.log(elements[i]);
                    self.eleblocks.push(elements[i].offsetTop - elements[i].offsetHeight);
                }
                self.eleblocks.push($('.preview-container', $preview).height());
                // console.log(self.mdblocks, self.eleblocks);
            });

            return deferred.promise;
        }

    });