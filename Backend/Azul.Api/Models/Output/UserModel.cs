using AutoMapper;
using Azul.Core.UserAggregate;

namespace Azul.Api.Models.Output;

public class UserModel
{
    public Guid Id { get; set; }
    public string Email { get; set; }
    public string UserName { get; set; }
    public DateOnly? LastVisitToPortugal { get; set; }
}

public class UserModelMappingProfile : Profile
{
    public UserModelMappingProfile()
    {
        CreateMap<User, UserModel>();
    }
}
