syntax = "proto2";

package pbCsv;

message PbCsv
{
    repeated string header = 1;
    repeated CsvRow rowList = 2;
}

message CsvRow
{
    repeated float valueList = 3; 
}
