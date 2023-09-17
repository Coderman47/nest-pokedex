import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Model, isValidObjectId } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class PokemonService {

  private defaultLimit: number;

  constructor(

    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,

    private readonly configService: ConfigService

  ) {

    this.defaultLimit = configService.get<number>('defaultLimit')
    console.log({defaultLimit: configService.get<number>('defaultLimit')})
  }

  findAll(paginationDto: PaginationDto) {

    const { limit = this.defaultLimit, offset = 0 } = paginationDto

    return this.pokemonModel.find()
    .limit(limit)
    .skip(offset)
    .sort({
      no: 1
    })
    .select( '-__v')
  }

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLowerCase();

    try {
      const pokemonToDB = await this.pokemonModel.create(createPokemonDto);
      return pokemonToDB;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  

  async findOne(term: string) {
    let pokemon: Pokemon;

    if (!isNaN(+term)) {
      pokemon = await this.pokemonModel.findOne({ no: term });
    }

    // MONGO ID
    if (!pokemon && isValidObjectId(term)) {
      pokemon = await this.pokemonModel.findById(term);
    }

    // NAME
    if (!pokemon) {
      pokemon = await this.pokemonModel.findOne({
        name: term.toLowerCase().trim(),
      });
    }

    // DOESN'T EXISTS
    if (!pokemon) {
      throw new NotFoundException(`Pokemon with id ${term} doesn't exists`);
    }

    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon = await this.findOne(term);

    if (updatePokemonDto.name) {
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
      
      try {
        
        await pokemon.updateOne(updatePokemonDto);

        return { ...pokemon.toJSON(), ...updatePokemonDto };

      }catch (error) {
        this.handleExceptions(error);
    }
  }
}

  async remove(id: string) {

    const { deletedCount } = await this.pokemonModel.deleteOne({ _id: id });

    if(deletedCount === 0)
      throw new BadRequestException(`Pokemon with id ${id} doesn't exists`)
    
    return;
  }


  // "Problemas similares, soluciones similares"
  private handleExceptions(error: any){
    if (error.code === 11000) {
      throw new BadRequestException(
        `Id is already in use - ID => ${JSON.stringify(error.keyValue)}`,
      );
    }

    console.log(error);
    throw new InternalServerErrorException(`Can't update that pokemon. Check server logs`)
  };

}

