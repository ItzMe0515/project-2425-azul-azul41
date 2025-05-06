using AutoMapper;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Api.Models.Output;

public class TileFactoryModel
{
    public List<FactoryDisplayModel> Displays { get; set; }
    public TableCenterModel TableCenter { get; set; }
    public bool IsEmpty { get; set; }
}

public class TileFactoryModelMappingProfile : Profile
{
    public TileFactoryModelMappingProfile()
    {
        CreateMap<ITileFactory, TileFactoryModel>()
            .ForMember(dest => dest.Displays, opt => opt.MapFrom(src => src.Displays))
            .ForMember(dest => dest.TableCenter, opt => opt.MapFrom(src => src.TableCenter))
            .ForMember(dest => dest.IsEmpty, opt => opt.MapFrom(src => src.IsEmpty));
    }
}
