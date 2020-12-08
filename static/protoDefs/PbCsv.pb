syntax = "proto2";

package pbCsv;

message PbCsv
{
    repeated string headerList = 6;
    repeated Column columnList = 5;
}

message Column
{
    oneof column_typed {
        ColumnFloat columnFloat = 3;
        ColumnInt columnInt = 4;
      }
}

message ColumnFloat
{
    repeated float valueList = 1;
}

message ColumnInt
{
    repeated int32 valueList = 2;
}