import { IsInt, IsPositive, IsString, IsUUID, Min, MinLength } from "class-validator";

export class CreatePokemonDto {

    // @IsUUID()
    @IsInt()
    @IsPositive()
    @Min(1)
    no: number;

    @IsString()
    @MinLength(2)
    name: string;
}
